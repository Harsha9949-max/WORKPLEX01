import * as fs from 'fs';
import * as path from 'path';

function replaceInFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content.replace(/Workple([^a-zA-Z])/gi, 'Workplex$1');
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log('Fixed', filePath);
  }
}

function traverse(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else {
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.html'].includes(path.extname(fullPath))) {
        replaceInFile(fullPath);
      }
    }
  }
}

traverse('./src');
traverse('./public');
replaceInFile('./index.html');
replaceInFile('./metadata.json');
