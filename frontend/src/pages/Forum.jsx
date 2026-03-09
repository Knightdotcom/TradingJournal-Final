import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Forum() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [commentText, setCommentText] = useState({});  // { postId: text }
  const [loading, setLoading] = useState(true);

  const fetchPosts = () => {
    api.get('/forum').then(res => {
      setPosts(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleNewPost = async (e) => {
    e.preventDefault();
    await api.post('/forum', { title, content });
    setTitle(''); setContent(''); setShowForm(false);
    fetchPosts();
  };

  const handleComment = async (postId) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    await api.post(`/forum/${postId}/comments`, { content: text });
    setCommentText(prev => ({ ...prev, [postId]: '' }));
    fetchPosts();
  };

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.heading}>Forum</h1>
          <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Avbryt' : '+ Nytt inlägg'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleNewPost} style={styles.form}>
            <input style={styles.input} placeholder="Rubrik" value={title}
              onChange={e => setTitle(e.target.value)} required />
            <textarea style={styles.textarea} placeholder="Skriv ditt inlägg..."
              value={content} onChange={e => setContent(e.target.value)} required />
            <button style={styles.addBtn} type="submit">Publicera</button>
          </form>
        )}

        {loading ? <p style={styles.muted}>Laddar...</p> : posts.length === 0
          ? <p style={styles.muted}>Inga inlägg ännu. Var först!</p>
          : posts.map(post => (
            <div key={post.id} style={styles.postCard}>
              {/* Inlägg */}
              <div style={styles.postHeader}>
                <div style={styles.avatar}>{post.user?.username?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <p style={styles.postAuthor}>{post.user?.username || 'Okänd'}</p>
                  <p style={styles.postDate}>{new Date(post.createdAt).toLocaleDateString('sv-SE')}</p>
                </div>
              </div>
              <h3 style={styles.postTitle}>{post.title}</h3>
              <p style={styles.postContent}>{post.content}</p>

              {/* Kommentarer */}
              {post.comments?.length > 0 && (
                <div style={styles.comments}>
                  {post.comments.map(c => (
                    <div key={c.id} style={styles.comment}>
                      <span style={styles.commentAuthor}>{c.user?.username || 'Okänd'}: </span>
                      <span style={styles.commentText}>{c.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Ny kommentar */}
              <div style={styles.commentForm}>
                <input style={styles.commentInput}
                  placeholder="Skriv en kommentar..."
                  value={commentText[post.id] || ''}
                  onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                />
                <button style={styles.commentBtn} onClick={() => handleComment(post.id)}>Skicka</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0f172a' },
  content: { padding: '2rem', maxWidth: '800px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  heading: { color: '#fff', margin: 0 },
  muted: { color: '#94a3b8' },
  addBtn: { background: '#38bdf8', color: '#0f172a', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  form: { background: '#1e293b', padding: '1.5rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  input: { padding: '0.65rem', borderRadius: '7px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.95rem' },
  textarea: { padding: '0.65rem', borderRadius: '7px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.95rem', minHeight: '100px' },
  postCard: { background: '#1e293b', borderRadius: '10px', padding: '1.5rem', marginBottom: '1.25rem', border: '1px solid #334155' },
  postHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#38bdf8', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  postAuthor: { color: '#fff', margin: 0, fontWeight: '600', fontSize: '0.9rem' },
  postDate: { color: '#475569', margin: 0, fontSize: '0.8rem' },
  postTitle: { color: '#38bdf8', margin: '0 0 0.5rem' },
  postContent: { color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6 },
  comments: { borderTop: '1px solid #334155', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  comment: { fontSize: '0.88rem' },
  commentAuthor: { color: '#38bdf8', fontWeight: '600' },
  commentText: { color: '#94a3b8' },
  commentForm: { display: 'flex', gap: '0.5rem', marginTop: '0.75rem' },
  commentInput: { flex: 1, padding: '0.5rem 0.75rem', borderRadius: '7px', border: '1px solid #334155', background: '#0f172a', color: '#fff', fontSize: '0.9rem' },
  commentBtn: { background: '#334155', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '7px', cursor: 'pointer', fontSize: '0.9rem' },
};
