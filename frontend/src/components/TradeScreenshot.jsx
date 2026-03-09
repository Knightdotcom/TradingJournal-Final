import { useState } from 'react';
import api from '../services/api';
import { useTheme, colors } from '../context/ThemeContext';

// Komponent för att ladda upp/visa screenshot på en trade
// Används inuti Trade-detalj eller Trade-formuläret
export default function TradeScreenshot({ tradeId, existingPath, onUpdate }) {
  const { isDark } = useTheme();
  const c          = colors(isDark);
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(existingPath ? `/screenshots/${existingPath}` : null);
  const [dragOver,  setDragOver]  = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/trades/${tradeId}/screenshot`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreview(res.data.url);
      onUpdate?.(res.data.screenshotPath);
    } catch {
      alert('Kunde inte ladda upp bilden. Max 5MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Ta bort screenshot?')) return;
    await api.delete(`/trades/${tradeId}/screenshot`);
    setPreview(null);
    onUpdate?.(null);
  };

  return (
    <div>
      <label style={{ display:'block', color:c.textMuted, fontSize:'0.78rem', marginBottom:'0.4rem' }}>
        📸 Chart-screenshot
      </label>

      {preview ? (
        <div style={{ position:'relative', display:'inline-block' }}>
          <img src={preview} alt="Trade screenshot"
            style={{ maxWidth:'100%', maxHeight:300, borderRadius:8, border:`1px solid ${c.border}`, display:'block' }} />
          <button onClick={handleDelete}
            style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.7)', color:'#fff', border:'none', borderRadius:'50%', width:26, height:26, cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center' }}>
            ✕
          </button>
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          style={{
            border: `2px dashed ${dragOver ? c.accent : c.border}`,
            borderRadius:8, padding:'1.5rem', textAlign:'center',
            background: dragOver ? c.accentBg : c.surface2,
            transition:'all 0.15s', cursor:'pointer'
          }}
          onClick={() => document.getElementById(`ss-${tradeId}`).click()}
        >
          <input id={`ss-${tradeId}`} type="file" accept="image/*" hidden
            onChange={e => handleFile(e.target.files[0])} />
          <p style={{ color: uploading ? c.accent : c.textMuted, margin:0, fontSize:'0.875rem' }}>
            {uploading ? '⏳ Laddar upp...' : '📸 Dra hit eller klicka för att ladda upp chart-screenshot'}
          </p>
          <p style={{ color: c.textFaint, fontSize:'0.75rem', margin:'0.3rem 0 0' }}>JPG, PNG, WebP — max 5MB</p>
        </div>
      )}
    </div>
  );
}
