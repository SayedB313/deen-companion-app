// A curated collection of daily hadiths and Quranic reminders
// Rotates based on the day of the year
const inspirations = [
  { text: "Verily, with hardship comes ease.", source: "Qur'an 94:6" },
  { text: "The best of you are those who learn the Qur'an and teach it.", source: "Sahih al-Bukhari" },
  { text: "Whoever believes in Allah and the Last Day, let him speak good or remain silent.", source: "Sahih al-Bukhari & Muslim" },
  { text: "The strong man is not the one who wrestles, but the one who controls himself at the time of anger.", source: "Sahih al-Bukhari" },
  { text: "None of you truly believes until he loves for his brother what he loves for himself.", source: "Sahih al-Bukhari & Muslim" },
  { text: "Take advantage of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before you are preoccupied, and your life before your death.", source: "Shu'ab al-Iman" },
  { text: "The most beloved deed to Allah is the most regular and constant even if it were little.", source: "Sahih al-Bukhari" },
  { text: "Indeed, Allah does not look at your appearance or wealth, but rather He looks at your hearts and actions.", source: "Sahih Muslim" },
  { text: "When you ask, ask Allah. When you seek help, seek help from Allah.", source: "Jami' at-Tirmidhi" },
  { text: "And whoever puts their trust in Allah, He will be enough for them.", source: "Qur'an 65:3" },
  { text: "Do not belittle any good deed, even meeting your brother with a cheerful face.", source: "Sahih Muslim" },
  { text: "The believer's shade on the Day of Resurrection will be his charity.", source: "Musnad Ahmad" },
  { text: "Patience is illumination.", source: "Sahih Muslim" },
  { text: "He who treads a path in search of knowledge, Allah will make easy for him the path to Paradise.", source: "Sahih Muslim" },
  { text: "Remember Allah in times of ease and He will remember you in times of difficulty.", source: "Musnad Ahmad" },
  { text: "And We have certainly made the Qur'an easy to remember. So is there anyone who will be mindful?", source: "Qur'an 54:17" },
  { text: "The supplication is the weapon of the believer.", source: "Mustadrak al-Hakim" },
  { text: "Make things easy and do not make them difficult. Give glad tidings and do not repel people.", source: "Sahih al-Bukhari" },
  { text: "A good word is charity.", source: "Sahih al-Bukhari & Muslim" },
  { text: "Whoever is grateful, it is only for their own good. And whoever is ungrateful, then surely my Lord is Self-Sufficient, Most Generous.", source: "Qur'an 27:40" },
  { text: "The worldly life is but a game and amusement. And the home of the Hereafter is best for those who fear Allah.", source: "Qur'an 6:32" },
  { text: "Indeed, the mercy of Allah is near to the doers of good.", source: "Qur'an 7:56" },
  { text: "Smiling in the face of your brother is an act of charity.", source: "Jami' at-Tirmidhi" },
  { text: "Every act of kindness is charity.", source: "Sahih al-Bukhari & Muslim" },
  { text: "Whoever does not show mercy will not be shown mercy.", source: "Sahih al-Bukhari & Muslim" },
  { text: "The best richness is the richness of the soul.", source: "Sahih al-Bukhari" },
  { text: "Be in this world as if you were a stranger or a traveler.", source: "Sahih al-Bukhari" },
  { text: "And your Lord says: Call upon Me, I will respond to you.", source: "Qur'an 40:60" },
  { text: "Whoever humbles himself for the sake of Allah, Allah will raise him.", source: "Sahih Muslim" },
  { text: "Tie your camel and then put your trust in Allah.", source: "Jami' at-Tirmidhi" },
  { text: "Indeed, Allah is with the patient.", source: "Qur'an 2:153" },
];

export function getDailyInspiration() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return inspirations[dayOfYear % inspirations.length];
}
