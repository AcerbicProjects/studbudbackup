// Probe each router to find which one doesn't export a valid handler
import { createRequire } from 'module';
const req = createRequire(import.meta.url);

const routers = [
    ['documentRouter', './routes/documents/document.routes.ts'],
    ['folderRouter', './routes/folders/folder.routes.ts'],
    ['authRouter', './routes/auth/auth.routes.ts'],
    ['userRouter', './routes/user.routes.ts'],
    ['statsRouter', './routes/stats/stats.routes.ts'],
    ['jobRouter', './routes/jobs/job.routes.ts'],
];

for (const [name, path] of routers) {
    try {
        const mod = req(path);
        const router = mod.default ?? mod;
        const isHandler = typeof router === 'function';
        console.log(`${name}: typeof=${typeof router}  isHandler=${isHandler}`);
    } catch (e) {
        console.log(`${name}: ERROR - ${e.message}`);
    }
}
