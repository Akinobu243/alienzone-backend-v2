const fs = require('fs');
const path = require('path');

/**
 * Generate OpenSea-compliant metadata JSON files for each character
 * based on the consolidated `metadata.json` in this folder.
 *
 * Spec reference: https://docs.opensea.io/docs/metadata-standards
 */
(function main() {
  const metadataPath = path.join(__dirname, 'metadata.json');

  if (!fs.existsSync(metadataPath)) {
    console.error('metadata.json not found in MetaData folder');
    process.exit(1);
  }

  /** @type {Array<any>} */
  const characters = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

  if (!Array.isArray(characters)) {
    console.error('metadata.json must contain an array of character objects');
    process.exit(1);
  }

  characters.forEach((item) => {
    if (item == null || typeof item !== 'object') return;
    if (item.tokenId == null) return;

    const portal = item.isPortal2 ? 'Portal 2' : 'Portal 1';

    const attributes = [
      { trait_type: 'Rarity', value: item.rarity },
      {
        display_type: 'number',
        trait_type: 'Power',
        value: item.power,
      },
      { trait_type: 'Element', value: item.element },
      { trait_type: 'Tier', value: item.tier },
      // { trait_type: 'Portal', value: portal },
    ];

    // if (item.teamImage) {
    //   attributes.push({
    //     trait_type: 'Team Image',
    //     value: item.teamImage,
    //   });
    // }

    // if (typeof item.isPortal2 === 'boolean') {
    //   attributes.push({
    //     trait_type: 'Is Portal 2',
    //     value: item.isPortal2,
    //   });
    // }

    // if (item.upgradesToId != null) {
    //   attributes.push({
    //     trait_type: 'Upgrades To Token ID',
    //     value: item.upgradesToId,
    //   });
    // }

    // if (item.upgradeReq != null) {
    //   attributes.push({
    //     display_type: 'number',
    //     trait_type: 'Upgrade Requirement',
    //     value: item.upgradeReq,
    //   });
    // }

    // Build a readable description using existing values from metadata.json
    const descriptionParts = [
      `${item.name} is a character in Alienzone.`,
      `Rarity: ${item.rarity}.`,
      `Element: ${item.element}.`,
      `Tier: ${item.tier}.`,
      `Base power: ${item.power}.`,
      `Token ID: ${item.tokenId}.`,
    ];

    const tokenMetadata = {
      name: item.name,
      description: descriptionParts.join(' '),
      image: item.image,

      // Optional
      attributes,
    };

    const outPath = path.join(__dirname, `${item.tokenId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(tokenMetadata, null, 2), 'utf8');
    console.log(`Wrote OpenSea metadata for tokenId ${item.tokenId} -> ${outPath}`);
  });
})();


