    // --- ACCESS DOM --- 
   export   const canvas = document.getElementById('board');
      const ctx = canvas.getContext('2d', { alpha: false });
      const editor = document.getElementById('editor');
      const stickyBtn = document.getElementById('tool-sticky');
      const selectBtn = document.getElementById('tool-select');
      const connectBtn = document.getElementById('tool-connect');
      const undoBtn = document.getElementById('undoBtn');
      const redoBtn = document.getElementById('redoBtn');
      const snapToggle = document.getElementById('snapToggle');
      const gridToggle = document.getElementById('gridToggle');
   