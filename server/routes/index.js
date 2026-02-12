import express from 'express';
import path from 'path';
import fs from 'fs';

export function createRoutes(staticPath, getCurrentProjectPath) {
  const router = express.Router();

  // Static files
  router.use(express.static(staticPath));

  // Image serving - dynamic based on current project path
  router.get('/todo-images/:filename', (req, res) => {
    const filename = req.params.filename;
    const currentPath = getCurrentProjectPath();
    const filePath = path.join(currentPath, 'todo-images', filename);
    
    if (fs.existsSync(filePath)) {
      return res.sendFile(path.resolve(filePath));
    }
    
    console.warn(`[IMAGE] Not found: ${filePath}`);
    res.status(404).send('Image not found');
  });

  return router;
}
