const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ISSUER = process.env.AMO_JWT_ISSUER;
const SECRET = process.env.AMO_JWT_SECRET;

async function runRelease() {
    try {
        console.log("🚀 Memulai proses rilis NetGhost...");

        // 1. Baca Manifest
        const manifestPath = './manifest.json';
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Versi saat ini
        const currentVersion = manifest.version;
        const versionParts = currentVersion.split('.').map(Number);
        versionParts[2] += 1; // Increment patch version
        const newVersion = versionParts.join('.');
        
        console.log(`📦 Meningkatkan versi: ${currentVersion} -> ${newVersion}`);
        
        // Update manifest.json
        manifest.version = newVersion;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        // 2. Jalankan penandatanganan otomatis via web-ext
        console.log("✍️ Mengirim ke Mozilla untuk penandatanganan (Signing)...");
        // web-ext sign --api-key=$ISSUER --api-secret=$SECRET --channel=unlisted
        // Ini akan menghasilkan file .xpi di folder web-ext-artifacts
        execSync(`npx web-ext sign --api-key="${ISSUER}" --api-secret="${SECRET}" --channel=unlisted`, { stdio: 'inherit' });

        // 3. Cari file .xpi yang baru diunduh
        const artifactsDir = './web-ext-artifacts';
        const files = fs.readdirSync(artifactsDir);
        const signedXpi = files
            .filter(f => f.endsWith('.xpi'))
            .sort((a, b) => fs.statSync(path.join(artifactsDir, b)).mtime - fs.statSync(path.join(artifactsDir, a)).mtime)[0];

        if (!signedXpi) throw new Error("File .xpi tidak ditemukan di web-ext-artifacts!");

        // 4. Update NetGhost.xpi untuk GitHub
        console.log("🚚 Memperbarui asset untuk GitHub...");
        fs.copyFileSync(path.join(artifactsDir, signedXpi), './netghost.xpi');

        // 5. Update updates.json
        console.log("📝 Memperbarui updates.json...");
        const updatesPath = './updates.json';
        const updates = JSON.parse(fs.readFileSync(updatesPath, 'utf8'));
        const addonId = "netghost-protector-final@yoru-dev.id";
        
        updates.addons[addonId].updates.unshift({
            "version": newVersion,
            "update_link": `https://raw.githubusercontent.com/vianpratama/netghost-protector/main/netghost.xpi`
        });
        fs.writeFileSync(updatesPath, JSON.stringify(updates, null, 2));

        // 6. Push ke GitHub
        console.log("📤 Mengunggah perubahan ke GitHub...");
        execSync('git add .');
        execSync(`.gitignore && git rm --cached .env || true`); // Extra safety
        execSync(`git commit -m "Auto-release version ${newVersion}"`);
        execSync('git push origin main');

        console.log(`\n✅ BERHASIL! NetGhost v${newVersion} sekarang sudah aktif di GitHub.`);
        console.log("Firefox akan mendeteksi update ini secara otomatis dalam 24 jam.");

    } catch (error) {
        console.error("\n❌ Gagal melakukan rilis:", error.message);
        process.exit(1);
    }
}

runRelease();
