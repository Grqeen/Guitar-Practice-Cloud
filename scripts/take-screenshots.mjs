import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('screenshots');
fs.mkdirSync(outDir, { recursive: true });

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function run() {
  console.log('Lancement du navigateur Edge...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,950'],
    defaultViewport: { width: 1280, height: 950 },
  });

  const page = await browser.newPage();

  // 1. Page de connexion
  console.log('Capture 1 : Page de connexion...');
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, '01_page_connexion.png') });

  // 2. Page d'inscription
  console.log('Capture 2 : Page d\'inscription...');
  await page.goto('http://localhost:4200/register', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(outDir, '02_page_inscription.png') });

  // 3. Connexion utilisateur (les identifiants sont déjà pré-remplis)
  console.log('Connexion avec les identifiants démo...');
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle2' });
  await page.click('button[type="submit"]');

  // Attente de l'arrivée sur la bibliothèque
  await page.waitForSelector('.tracks-container', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 2000));

  console.log('Capture 3 : Bibliothèque des morceaux...');
  await page.screenshot({ path: path.join(outDir, '03_bibliotheque_morceaux.png') });

  // 4. Test d'écoute audio si un morceau est disponible
  const playButton = await page.$('.btn-play');
  if (playButton) {
    console.log('Clic sur Écouter un morceau...');
    await playButton.click();
    await new Promise((r) => setTimeout(r, 2500));
    console.log('Capture 4 : Lecteur audio persistant...');
    await page.screenshot({ path: path.join(outDir, '04_lecteur_audio_persistant.png') });
  }

  // 5. Page de profil
  console.log('Capture 5 : Page Profil utilisateur...');
  await page.goto('http://localhost:4200/profile', { waitUntil: 'networkidle2' });
  await page.waitForSelector('.profile-header', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '05_profil_utilisateur.png') });

  await browser.close();
  console.log('Toutes les captures ont été enregistrées avec succès dans /screenshots !');
}

run().catch((err) => {
  console.error('Erreur lors des captures :', err);
  process.exit(1);
});
