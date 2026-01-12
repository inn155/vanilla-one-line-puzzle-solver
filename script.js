let cropper; 
let cleanCroppedImage = null; 
let startPoint = null;
let endPoint = null;
let inputMode = 'start';

// Elements
const imageInput = document.getElementById('imageInput');
const imageToCrop = document.getElementById('imageToCrop');
const stepUpload = document.getElementById('stepUpload');
const stepCrop = document.getElementById('stepCrop');
const stepSolve = document.getElementById('stepSolve');
const resultCanvas = document.getElementById('resultCanvas');
const btnCrop = document.getElementById('btnCrop');
const btnProcess = document.getElementById('btnProcess');
const instructionText = document.getElementById('instructionText');
const inputCols = document.getElementById('inputCols');
const inputRows = document.getElementById('inputRows');
const modeStartBtn = document.getElementById('modeStart');
const modeEndBtn = document.getElementById('modeEnd');

// --- 1. UPLOAD GAMBAR ---
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imageToCrop.src = event.target.result;
            stepUpload.style.display = 'none';
            stepCrop.style.display = 'block';
            
            if (cropper) cropper.destroy();
            cropper = new Cropper(imageToCrop, { 
                viewMode: 1, 
                autoCropArea: 0.9,
                dragMode: 'move'
            });
        };
        reader.readAsDataURL(file);
    }
});

// --- 2. CROP ---
btnCrop.addEventListener('click', function() {
    if (!cropper) return;
    const croppedCanvas = cropper.getCroppedCanvas();
    
    // Set ukuran canvas
    resultCanvas.width = croppedCanvas.width;
    resultCanvas.height = croppedCanvas.height;
    
    const ctx = resultCanvas.getContext('2d');
    ctx.drawImage(croppedCanvas, 0, 0);
    cleanCroppedImage = ctx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
    
    stepCrop.style.display = 'none';
    stepSolve.style.display = 'block';

    // Auto deteksi ukran grid
    const threshold = calculateThreshold(cleanCroppedImage.data);
    const dCols = scanProfile(cleanCroppedImage.data, resultCanvas.width, resultCanvas.height, 'horizontal', threshold);
    const dRows = scanProfile(cleanCroppedImage.data, resultCanvas.width, resultCanvas.height, 'vertical', threshold);
    
    inputCols.value = dCols > 1 ? dCols : 5;
    inputRows.value = dRows > 1 ? dRows : 6;

    updateUI();
});

// --- 3. INPUT TITIK AWAL AKHIR  ---
inputCols.addEventListener('change', updateUI);
inputRows.addEventListener('change', updateUI);

modeStartBtn.addEventListener('click', () => { setMode('start'); });
modeEndBtn.addEventListener('click', () => { setMode('end'); });

function setMode(mode) {
    inputMode = mode;
    modeStartBtn.className = mode === 'start' ? 'btn btn-tool col active' : 'btn btn-tool col';
    modeEndBtn.className = mode === 'end' ? 'btn btn-tool col active' : 'btn btn-tool col';
    instructionText.innerText = mode === 'start' ? "Klik kotak untuk TITIK AWAL (Hijau)" : "Klik kotak untuk TITIK AKHIR (Merah)";
}

// set titik
resultCanvas.addEventListener('click', function(event) {
    if (!cleanCroppedImage) return;
    
    // Hitung koordinat klik relatif terhadap ukuran asli canvas
    // (Karena canvas di-scale oleh CSS, maka perlu matematika ini)
    const rect = resultCanvas.getBoundingClientRect();
    const scaleX = resultCanvas.width / rect.width;
    const scaleY = resultCanvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    if (inputMode === 'start') {
        startPoint = { x, y };
        setMode('end'); // Otomatis pindah ke mode finish setelah pilih start
    } else {
        endPoint = { x, y };
    }

    updateUI();
});

function updateUI() {
    if (!cleanCroppedImage) return;
    const ctx = resultCanvas.getContext('2d');
    const cols = parseInt(inputCols.value);
    const rows = parseInt(inputRows.value);
    const w = resultCanvas.width;
    const h = resultCanvas.height;
    const cellW = w / cols;
    const cellH = h / rows;

    // 1. Reset Gambar
    ctx.putImageData(cleanCroppedImage, 0, 0);

    // 2. Gambar Grid Tipis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // Gambar titik kuning tengah (DEBUG)
            const cx = (c + 0.5) * cellW;
            const cy = (r + 0.5) * cellH;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.fillRect(cx-2, cy-2, 4, 4); 
        }
    }

    // 3. Gambar Start Point
    if (startPoint) {
        ctx.fillStyle = '#00ff00';
        ctx.beginPath(); ctx.arc(startPoint.x, startPoint.y, cellW * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
    }

    // 4. Gambar End Point
    if (endPoint) {
        ctx.fillStyle = '#ff0000';
        ctx.beginPath(); ctx.arc(endPoint.x, endPoint.y, cellW * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
    }

    // 5. Cek Status Tombol Proses
    if (startPoint && endPoint) {
        btnProcess.disabled = false;
        btnProcess.innerHTML = "SELESAIKAN PUZZLE";
        instructionText.innerText = "Siap! Pastikan titik kuning pas di tengah kotak.";
    } else {
        btnProcess.disabled = true;
    }
}


// --- 4. LOGIKA PENYELESAIAN ---
btnProcess.addEventListener('click', function() {
    if(!startPoint || !endPoint) return;

    const cols = parseInt(inputCols.value);
    const rows = parseInt(inputRows.value);
    const w = resultCanvas.width;
    const h = resultCanvas.height;
    const cellW = w / cols;
    const cellH = h / rows;
    const ctx = resultCanvas.getContext('2d');
    const imageData = cleanCroppedImage.data;

    // ubah ke index baris/kolom
    const startNode = { c: Math.floor(startPoint.x / cellW), r: Math.floor(startPoint.y / cellH) };
    const endNode = { c: Math.floor(endPoint.x / cellW), r: Math.floor(endPoint.y / cellH) };

    // buat matriks
    const threshold = calculateThreshold(imageData);
    let grid = [];

    for (let r = 0; r < rows; r++) {
        let rowArr = [];
        for (let c = 0; c < cols; c++) {
            const cx = Math.floor((c + 0.5) * cellW);
            const cy = Math.floor((r + 0.5) * cellH);
            const i = (cy * w + cx) * 4;
            const brightness = (imageData[i] + imageData[i+1] + imageData[i+2]) / 3;

            // logika: apakah kotak ini bisa dilalui?
            // Titik awal & akhir selalu bisa dilalui
            if ((r === startNode.r && c === startNode.c) || (r === endNode.r && c === endNode.c)) {
                rowArr.push(1);
            } else if (brightness > threshold) {
                rowArr.push(1); // blok terdeteksi
            } else {
                rowArr.push(0); // blok kosong
            }
        }
        grid.push(rowArr);
    }

    // Solusi
    const path = solveOneLine(grid, startNode, endNode, rows, cols);
    
    if (path) {
        drawSolution(ctx, path, cellW, cellH);
        instructionText.innerHTML = `<span style="color:#00ffff">★ SOLUSI DITEMUKAN! ★</span>`;
    } else {
        alert("Tidak ada solusi! Cek apakah jumlah kolom/baris sudah benar? Atau ada kotak yang salah deteksi?");
    }
});


// --- FUNGSI BANTUAN ---
function calculateThreshold(data) {
    let sum = 0, count = 0;
    for(let i=0; i<data.length; i+=400) { sum += (data[i]+data[i+1]+data[i+2])/3; count++; }
    return (sum/count) + 10;
}

function scanProfile(data, w, h, mode, threshold) {
    const limitMain = (mode === 'horizontal') ? w : h;
    const limitCross = (mode === 'horizontal') ? h : w;
    let histogram = new Array(limitMain).fill(0);
    const checks = [0.25, 0.5, 0.75];
    
    for(let i=0; i<limitMain; i++) {
        let isBright = false;
        for(let ratio of checks) {
            let x, y;
            if(mode === 'horizontal') { x=i; y=Math.floor(limitCross*ratio); }
            else { x=Math.floor(limitCross*ratio); y=i; }
            const idx = (y*w+x)*4;
            if((data[idx]+data[idx+1]+data[idx+2])/3 > threshold) { isBright = true; break; }
        }
        if(isBright) histogram[i] = 1;
    }

    let segments = 0;
    let inSegment = false;
    for(let i=0; i<histogram.length; i++) {
        if(histogram[i] === 1 && !inSegment) { segments++; inSegment = true; }
        else if(histogram[i] === 0) { inSegment = false; }
    }
    return segments;
}

function solveOneLine(grid, start, end, rows, cols) {
    let total = 0;
    for(let r=0; r<rows; r++) for(let c=0; c<cols; c++) if(grid[r][c]===1) total++;

    function backtrack(r, c, count, path) {
        path.push({r, c});
        if (r === end.r && c === end.c && count === total) return path;
        grid[r][c] = 0; // visited
        
        const moves = [{dr:-1,dc:0}, {dr:1,dc:0}, {dr:0,dc:-1}, {dr:0,dc:1}];
        for (let m of moves) {
            let nr = r+m.dr, nc = c+m.dc;
            if (nr>=0 && nr<rows && nc>=0 && nc<cols && grid[nr][nc]===1) {
                if (backtrack(nr, nc, count+1, path)) return path;
            }
        }
        grid[r][c] = 1; // backtrack
        path.pop();
        return null;
    }
    return backtrack(start.r, start.c, 1, []);
}

function drawSolution(ctx, path, cw, ch) {
    // Gambar ulang UI dasar
    updateUI(); 
    
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#00ffff'; 
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowBlur = 15; ctx.shadowColor = '#00ffff';
    
    ctx.beginPath();
    const sx = (path[0].c + 0.5) * cw, sy = (path[0].r + 0.5) * ch;
    ctx.moveTo(sx, sy);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo((path[i].c + 0.5) * cw, (path[i].r + 0.5) * ch);
    }
    ctx.stroke();
}