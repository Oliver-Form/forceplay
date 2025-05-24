'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Feedback {
  id: string;
  name: string;
  email: string;
  title: string;
  message: string;
  created_at: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [form, setForm] = useState(() => {
    // Prefill name/email from localStorage
    let storedName = '';
    let storedEmail = '';
    if (typeof window !== 'undefined') {
      storedName = localStorage.getItem('feedbackName') || '';
      storedEmail = localStorage.getItem('feedbackEmail') || '';
    }
    return { name: storedName, email: storedEmail, title: '', message: '' };
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchFeedback() {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) console.error('Error fetching feedback:', error);
      else setFeedbacks(data || []);
    }
    fetchFeedback();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // ensure valid email format
    if (!emailRegex.test(form.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .insert([{ ...form }])
      .select();
    if (error) {
      alert('Submission error: ' + error.message);
    } else {
      // prepend new comment
      setFeedbacks(prev => [data![0] as Feedback, ...prev]);
      setForm({ name: '', email: '', title: '', message: '' });
    }
    setLoading(false);
  };
  
  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Feedback & Feature Suggestions</h1>
      <div style={{ backgroundColor: 'transparent', padding: '1rem', borderRadius: '8px', boxShadow: 'none', marginBottom: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name:<br />
              <input
                type="text" required value={form.name}
                onChange={e => {
                  const v = e.target.value;
                  setForm(f => ({ ...f, name: v }));
                  localStorage.setItem('feedbackName', v);
                }}
                style={{ width: '100%', padding: '8px', border: '1px solid #fff', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box', marginTop: '4px', marginBottom: '8px' }}
              />
            </label>
          </div>
          <div>
            <label>Email:<br />
              <input
                type="email" required value={form.email}
                onChange={e => {
                  const v = e.target.value;
                  setForm(f => ({ ...f, email: v }));
                  localStorage.setItem('feedbackEmail', v);
                }}
                style={{ width: '100%', padding: '8px', border: '1px solid #fff', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box', marginTop: '4px', marginBottom: '8px' }}
              />
            </label>
          </div>
          <div>
            <label>Title:<br />
              <input
                type="text" required value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #fff', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box', marginTop: '4px', marginBottom: '8px' }}
              />
            </label>
          </div>
          <div>
            <label>Message:<br />
              <textarea
                required value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                rows={4}
                style={{ width: '100%', padding: '8px', border: '1px solid #fff', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)', boxSizing: 'border-box', marginTop: '4px', marginBottom: '8px' }}
              />
            </label>
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      <h2>All Feedback</h2>
      {feedbacks.length === 0 ? (
        <p>No feedback yet. Be the first to comment!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {feedbacks.map(fb => (
            <li key={fb.id} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #ccc', paddingBottom: '1rem' }}>
              <strong>{fb.title}</strong> <em>by {fb.name} on {new Date(fb.created_at).toLocaleString()}</em>
              <p>{fb.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}