const DEFAULT_DOWNLOAD_BYTES = 10 * 1024 * 1024;
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;
const CHUNK_BYTES = 64 * 1024;

const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Speed Test API is operational.',
    timestamp: new Date().toISOString()
  });
};

// The browser measures download time. Stream a bounded payload so the server
// does not need to keep the complete response in memory for every visitor.
const getDownload = (req, res) => {
  const requestedBytes = Number.parseInt(req.query.bytes, 10);
  const totalBytes = Number.isFinite(requestedBytes) && requestedBytes > 0
    ? Math.min(requestedBytes, MAX_DOWNLOAD_BYTES)
    : DEFAULT_DOWNLOAD_BYTES;

  res.status(200);
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(totalBytes),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Access-Control-Expose-Headers': 'Content-Length'
  });

  const chunk = Buffer.alloc(CHUNK_BYTES, 0x5a);
  let remaining = totalBytes;

  const writeNext = () => {
    while (remaining > 0) {
      const size = Math.min(remaining, chunk.length);
      remaining -= size;
      if (!res.write(size === chunk.length ? chunk : chunk.subarray(0, size))) {
        res.once('drain', writeNext);
        return;
      }
    }
    res.end();
  };

  writeNext();
};

// Consume the request stream without buffering the upload in memory. The
// browser measures how long its request takes and uses the returned count.
const postUpload = (req, res, next) => {
  let bytesReceived = 0;
  let tooLarge = false;

  req.on('data', (chunk) => {
    bytesReceived += chunk.length;
    if (bytesReceived > MAX_UPLOAD_BYTES) {
      tooLarge = true;
      res.status(413).json({
        success: false,
        message: `Upload exceeds the ${MAX_UPLOAD_BYTES} byte limit.`
      });
      // Drain the rest of the incoming request so the 413 response can reach
      // the client cleanly without retaining additional data in memory.
    }
  });

  req.on('end', () => {
    if (tooLarge) return;
    res.set('Cache-Control', 'no-store');
    res.status(200).json({ success: true, bytesReceived });
  });

  req.on('error', (error) => {
    if (!tooLarge) next(error);
  });
};

const getPing = (req, res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0'
  });
  res.status(200).json({ success: true, timestamp: Date.now() });
};

module.exports = { getHealth, getDownload, postUpload, getPing };
