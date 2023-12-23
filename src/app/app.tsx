import { createRoot } from 'react-dom/client';
import './app.css';
import { Root } from './components/Root';

const root_id = '__root';

function getRoot() {
  const existing = document.getElementById(root_id);
  if (existing) {
    return existing;
  }

  const el = document.createElement('div');
  el.id = root_id;
  document.body.appendChild(el);
  return el;
}

async function start() {
  const root = createRoot(getRoot());
  root.render(<Root />);
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', start)
  : start();
