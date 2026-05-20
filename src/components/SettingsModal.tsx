import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MODELS } from '../types';
import type { ModelId } from '../types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [keys, setKeys] = useState<Record<ModelId, string>>({
    chatgpt: '',
    gemini: '',
    claude: '',
  });

  useEffect(() => {
    if (open) {
      setKeys({
        chatgpt: localStorage.getItem('trilens_key_chatgpt') || '',
        gemini: localStorage.getItem('trilens_key_gemini') || '',
        claude: localStorage.getItem('trilens_key_claude') || '',
      });
    }
  }, [open]);

  const handleSave = () => {
    for (const model of MODELS) {
      const val = keys[model.id].trim();
      if (val) {
        localStorage.setItem(`trilens_key_${model.id}`, val);
      } else {
        localStorage.removeItem(`trilens_key_${model.id}`);
      }
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>API Key Settings</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            APIキーはブラウザのlocalStorageに保存されます。サーバーには送信されません。
          </p>
          {MODELS.map((model) => (
            <div key={model.id} className="api-key-group">
              <label>
                <span
                  className="model-dot"
                  style={{ backgroundColor: model.color, display: 'inline-block', width: 8, height: 8, borderRadius: '50%' }}
                />
                {model.name}
              </label>
              <input
                type="password"
                className="api-key-input"
                placeholder={
                  model.id === 'chatgpt'
                    ? 'sk-...'
                    : model.id === 'gemini'
                    ? 'AIza...'
                    : 'sk-ant-...'
                }
                value={keys[model.id]}
                onChange={(e) => setKeys({ ...keys, [model.id]: e.target.value })}
              />
              <div className={`api-key-status ${keys[model.id] ? 'status-set' : 'status-unset'}`}>
                {keys[model.id] ? 'Key set' : 'Not configured'}
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="modal-save-btn" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
