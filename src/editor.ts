import { stripJsonComments } from './strip-json-comments';
import { TRIM_JSON_REG,DEFAULT_DATA } from './constant';
import forward from './forward';

window.require.config({ paths: { vs: '../lib/monaco-editor/min/vs' } });

let editor;
chrome.storage.sync.get('config_for_shown', result => {
  let firstShow = 1;
  window.require(['vs/language/json/monaco.contribution'], () => {
    editor = window.monaco.editor.create(
      document.getElementById('container'),
      {
        value: result.config_for_shown || DEFAULT_DATA,
        language: 'json',

        minimap: {
          enabled: false
        },
        fontFamily: 'source-code-pro,Menlo,Monaco,Consolas,Courier New,monospace',
        fontSize: 13,
        fontLigatures: true,

        contextmenu: false,
        scrollBeyondLastLine: false,
        folding: true,
        showFoldingControls: 'always',

        useTabStops: true,
        wordBasedSuggestions: true,
        quickSuggestions: true,
        suggestOnTriggerCharacters: true
      }
    );

    function setStorage() {
      const data = editor.getValue();
      const config = stripJsonComments(data)
        .replace(/\s+/g, '')
        .replace(TRIM_JSON_REG, ($0, $1, $2) => $2);
      try {
        console.log('=========data');
        console.log(data);
        console.log('=========config');
        console.log(config);
      } catch (e) {
        console.error(e);
      }

      chrome.storage.sync.set(
        {
          config_for_shown: data,
          config
        },
        () => { }
      );
    }

    setStorage();

    window.monaco.languages.registerCompletionItemProvider('json', {
      provideCompletionItems: () => {
        const textArr = [];
        forward.urls.forEach(item => {
          if (item) {
            textArr.push({
              label: item,
              kind: window.monaco.languages.CompletionItemKind.Text
            });
          }
        });

        const extraItems = [
          {
            label: 'rule',
            kind: window.monaco.languages.CompletionItemKind.Method,
            insertText: {
              value: `[
  "\${1:from}",
  "\${1:to}",
],`
            }
          }
        ];
        return [...textArr, ...extraItems];
      }
    });

    editor.onDidChangeModelContent(() => {
      setStorage();
    });
    editor.onDidScrollChange(() => {
      if (firstShow) {
        firstShow = 0;
        runFormat();
      }
    })
  });
});

function runFormat() {
  return editor.trigger('anyString', 'editor.action.formatDocument')
}

function preventSave() {
  document.addEventListener(
    'keydown',
    e => {
      if (
        e.keyCode === 83 &&
        (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)
      ) {
        e.preventDefault();
      }
    },
    false
  );
}

function turnOn() {
  document.getElementById('J_Switch').classList.add('ant-switch-checked');
  document.getElementById('J_SwitchInner').innerHTML = 'On';
}

function turnOff() {
  document.getElementById('J_Switch').classList.remove('ant-switch-checked');
  document.getElementById('J_SwitchInner').innerHTML = 'Off';
}

chrome.storage.sync.get('disabled', result => {
  document.getElementById('J_SwitchArea').style.opacity = "1";
  if (result.disabled === 'disabled') {
    turnOff();
  } else {
    turnOn();
  }
});

document.getElementById('J_Switch').addEventListener('click', ev => {
  // if disabled
  if ((<HTMLSelectElement>ev.currentTarget).classList.contains('ant-switch-checked')) {
    turnOff();
    chrome.storage.sync.set({
      disabled: 'disabled'
    });
  } else {
    chrome.storage.sync.set({
      disabled: ''
    });
    turnOn();
  }
});

document.getElementById('J_OpenInNewTab').addEventListener('click', ev => {
  chrome.tabs.create({ url: chrome.extension.getURL('XSwitch.html') }, function (
    tab
  ) {
    // Tab opened.
  });
});

document.getElementById('J_OpenReadme').addEventListener('click', ev => {
  chrome.tabs.create({ url: 'https://yuque.com/jiushen/blog/xswitch-readme' }, function (
    tab
  ) {
    // Tab opened.
  });
});

preventSave();
