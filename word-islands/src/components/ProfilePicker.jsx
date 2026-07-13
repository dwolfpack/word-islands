import { useState } from 'react';
import { t } from '../i18n.js';

const AVATARS = ['🦊', '🐼', '🐯', '🦄', '🐸', '🐙', '🦋', '🐳'];

export default function ProfilePicker({ profiles, lang, onSelect, onCreate, onDelete }) {
  const [creating, setCreating] = useState(profiles.length === 0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [path, setPath] = useState('5-7');

  if (!creating) {
    return (
      <div>
        <h2 className="instruction">{t(lang, 'chooseProfile')}</h2>
        <div className="profiles">
          {profiles.map((p) => (
            <div key={p.id} className="profile-card">
              <button className="profile-btn" onClick={() => onSelect(p.id)}>
                <span className="avatar">{p.avatar}</span>
                <span>{p.name}</span>
              </button>
              <button
                className="delete-icon"
                title={t(lang, 'deleteProfile')}
                onClick={() => {
                  const message = `${t(lang, 'deleteProfile')} — ${p.name}?\n${t(lang, 'confirmDeleteProfile')}`;
                  if (window.confirm(message)) onDelete(p.id);
                }}
              >
                🗑️
              </button>
            </div>
          ))}
          <button className="profile-btn" onClick={() => setCreating(true)}>
            <span className="avatar">➕</span>
            <span>{t(lang, 'newProfile')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-form">
      <h2>{t(lang, 'newProfile')}</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t(lang, 'yourName')}
        maxLength={20}
      />
      <p>{t(lang, 'pickAvatar')}</p>
      <div className="avatar-row">
        {AVATARS.map((a) => (
          <button
            key={a}
            className={`avatar-choice ${a === avatar ? 'selected' : ''}`}
            onClick={() => setAvatar(a)}
          >
            {a}
          </button>
        ))}
      </div>
      <p>{t(lang, 'pickPath')}</p>
      <div className="path-row">
        <button
          className={`path-choice ${path === '5-7' ? 'selected' : ''}`}
          onClick={() => setPath('5-7')}
        >
          {t(lang, 'path57')}
        </button>
        <button
          className={`path-choice ${path === '8-10' ? 'selected' : ''}`}
          onClick={() => setPath('8-10')}
        >
          {t(lang, 'path810')}
        </button>
      </div>
      <button
        className="big-btn"
        disabled={!name.trim()}
        onClick={() => onCreate({ name: name.trim(), avatar, path })}
      >
        {t(lang, 'start')}
      </button>
      {profiles.length > 0 && (
        <button onClick={() => setCreating(false)}>{t(lang, 'back')}</button>
      )}
    </div>
  );
}
