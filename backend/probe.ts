// probe.ts – check each router's default export
const routers: [string, string][] = [
    ['documentRouter', './routes/documents/document.routes'],
    ['folderRouter', './routes/folders/folder.routes'],
    ['authRouter', './routes/auth/auth.routes'],
    ['userRouter', './routes/user.routes'],
    ['statsRouter', './routes/stats/stats.routes'],
    ['jobRouter', './routes/jobs/job.routes'],
];

for (const [name, path] of routers) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(path);
        const router = mod.default ?? mod;
        console.log(`${name}: typeof=${typeof router}`);
    } catch (e: any) {
        console.log(`${name}: LOAD ERROR – ${e.message?.slice(0, 120)}`);
    }
}
