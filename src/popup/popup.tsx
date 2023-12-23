import { safeParseURL } from '@flagpoonage/tools';
import './popup.css';
import { createRoot } from 'react-dom/client';

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

function onClick(tab_id: number) {
  return function () {
    chrome.scripting.executeScript({
      target: { tabId: tab_id },
      files: ['content/content.js'],
    });
  };
}

async function start() {
  const root = createRoot(getRoot());
  const tabs = await chrome.tabs.query({ active: true });

  const tab = tabs[0];

  const tab_url_result = tab?.url ? safeParseURL(tab.url) : null;
  const tab_url =
    tab_url_result && tab_url_result.success ? tab_url_result.value : null;
  const tab_id = tab?.id ?? null;

  root.render(
    <div>
      <div>
        <a
          target={'_blank'}
          rel="noreferrer"
          href={chrome.runtime.getURL('app.html')}
        >
          Open Settings
        </a>
      </div>
      {tab_url && tab_id && (
        <button
          onClick={onClick(tab_id)}
        >{`Authenticate on ${tab_url.hostname}`}</button>
      )}
    </div>,
  );
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', start)
  : start();
