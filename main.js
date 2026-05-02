const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

app.whenReady().then(createWindow);

ipcMain.handle('select-files', async () => {
  const res = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'MP4', extensions: ['mp4'] }]
  });
  return res.filePaths;
});

ipcMain.on('start', (e, files) => {
  files.forEach(file => {
    const output = file.replace('.mp4', '_mute.mp4');

    ffmpeg(file)
      .outputOptions('-an')
      .on('progress', p => {
        e.sender.send('progress', {
          file,
          percent: p.percent || 0
        });
      })
      .on('end', () => {
        e.sender.send('done', file);
      })
      .save(output);
  });
});

const html = `
<body style="background:#111;color:#fff;font-family:sans-serif">
<h2>批量消音工具</h2>
<button onclick="pick()">选择视频</button>
<button onclick="run()">开始</button>
<div id="list"></div>

<script>
const { ipcRenderer } = require('electron');
let files = [];

async function pick(){
  files = await ipcRenderer.invoke('select-files');
  let html = '';
  files.forEach(f=>{
    html += '<div>'+f+'<div style="background:#333;height:10px"><div id="'+f+'" style="background:#0f0;height:10px;width:0%"></div></div></div>';
  });
  document.getElementById('list').innerHTML = html;
}

function run(){
  ipcRenderer.send('start', files);
}

ipcRenderer.on('progress',(e,d)=>{
  const el = document.getElementById(d.file);
  if(el) el.style.width = d.percent+'%';
});
</script>
</body>
`;