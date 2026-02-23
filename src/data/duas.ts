export interface Dua {
  id: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
}

export interface DuaCategory {
  id: string;
  name: string;
  icon: string;
  duas: Dua[];
}

export const duaCategories: DuaCategory[] = [
  {
    id: "morning",
    name: "Morning Adhkar",
    icon: "🌅",
    duas: [
      {
        id: "m1",
        title: "Upon waking up",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
        transliteration: "Alhamdu lillahil-ladhi ahyana ba'da ma amatana wa ilayhin-nushur",
        translation: "All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.",
        reference: "Bukhari",
      },
      {
        id: "m2",
        title: "Morning remembrance",
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
        transliteration: "Asbahna wa asbahal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah",
        translation: "We have entered a new morning and with it all dominion belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone, having no partner.",
        reference: "Muslim",
      },
      {
        id: "m3",
        title: "Seeking protection (morning)",
        arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shai'un fil-ardi wa la fis-sama'i wa huwas-sami'ul-'alim",
        translation: "In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.",
        reference: "Abu Dawud, Tirmidhi",
      },
    ],
  },
  {
    id: "evening",
    name: "Evening Adhkar",
    icon: "🌙",
    duas: [
      {
        id: "e1",
        title: "Evening remembrance",
        arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
        transliteration: "Amsayna wa amsal-mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la sharika lah",
        translation: "We have entered a new evening and with it all dominion belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah alone, having no partner.",
        reference: "Muslim",
      },
      {
        id: "e2",
        title: "Seeking refuge (evening)",
        arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        transliteration: "A'udhu bi kalimatillahit-tammati min sharri ma khalaq",
        translation: "I seek refuge in the perfect words of Allah from the evil of what He has created.",
        reference: "Muslim",
      },
      {
        id: "e3",
        title: "Before sleeping",
        arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        transliteration: "Bismika Allahumma amutu wa ahya",
        translation: "In Your name, O Allah, I die and I live.",
        reference: "Bukhari",
      },
    ],
  },
  {
    id: "salah",
    name: "Prayer Related",
    icon: "🕌",
    duas: [
      {
        id: "s1",
        title: "Entering the mosque",
        arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        transliteration: "Allahummaf-tah li abwaba rahmatik",
        translation: "O Allah, open for me the doors of Your mercy.",
        reference: "Muslim",
      },
      {
        id: "s2",
        title: "After the adhan",
        arabic: "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ، آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ",
        transliteration: "Allahumma rabba hadhihid-da'watit-tammah, wassalatil-qa'imah, ati Muhammadanil-wasilata wal-fadilah, wab'athhu maqaman mahmudan alladhi wa'adtah",
        translation: "O Allah, Lord of this perfect call and established prayer, grant Muhammad the intercession and favor, and raise him to the praised station You have promised him.",
        reference: "Bukhari",
      },
      {
        id: "s3",
        title: "After salah",
        arabic: "أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ. اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
        transliteration: "Astaghfirullah, Astaghfirullah, Astaghfirullah. Allahumma antas-salamu wa minkas-salam, tabarakta ya dhal-jalali wal-ikram",
        translation: "I seek the forgiveness of Allah (3x). O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honor.",
        reference: "Muslim",
      },
    ],
  },
  {
    id: "daily",
    name: "Daily Activities",
    icon: "☀️",
    duas: [
      {
        id: "d1",
        title: "Before eating",
        arabic: "بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ",
        transliteration: "Bismillahi wa 'ala barakatillah",
        translation: "In the name of Allah and with the blessings of Allah.",
        reference: "Abu Dawud",
      },
      {
        id: "d2",
        title: "After eating",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
        transliteration: "Alhamdu lillahil-ladhi at'amana wa saqana wa ja'alana muslimin",
        translation: "All praise is for Allah who fed us, gave us drink, and made us Muslims.",
        reference: "Abu Dawud, Tirmidhi",
      },
      {
        id: "d3",
        title: "Leaving the house",
        arabic: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        transliteration: "Bismillah, tawakkaltu 'alallah, wa la hawla wa la quwwata illa billah",
        translation: "In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.",
        reference: "Abu Dawud, Tirmidhi",
      },
      {
        id: "d4",
        title: "Entering the house",
        arabic: "بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
        transliteration: "Bismillahi walajna, wa bismillahi kharajna, wa 'ala Allahi rabbina tawakkalna",
        translation: "In the name of Allah we enter, in the name of Allah we leave, and upon Allah our Lord we place our trust.",
        reference: "Abu Dawud",
      },
    ],
  },
  {
    id: "travel",
    name: "Travel",
    icon: "✈️",
    duas: [
      {
        id: "t1",
        title: "Dua for travel",
        arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ",
        transliteration: "Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila rabbina lamunqalibun",
        translation: "Glory to Him who has subjected this to us, and we could never have it by our efforts. And to our Lord, surely, we must return.",
        reference: "Muslim",
      },
      {
        id: "t2",
        title: "Returning from travel",
        arabic: "آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ",
        transliteration: "Ayibuna, ta'ibuna, 'abiduna, lirabbina hamidun",
        translation: "We return repentant, worshipping, and praising our Lord.",
        reference: "Muslim",
      },
    ],
  },
  {
    id: "protection",
    name: "Protection & Healing",
    icon: "🛡️",
    duas: [
      {
        id: "p1",
        title: "Dua for anxiety",
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَالْعَجْزِ وَالْكَسَلِ وَالْبُخْلِ وَالْجُبْنِ وَضَلَعِ الدَّيْنِ وَغَلَبَةِ الرِّجَالِ",
        transliteration: "Allahumma inni a'udhu bika minal-hammi wal-hazan, wal-'ajzi wal-kasal, wal-bukhli wal-jubn, wa dala'id-dayni wa ghalabatir-rijal",
        translation: "O Allah, I seek refuge in You from worry and grief, from weakness and laziness, from miserliness and cowardice, from being burdened by debt and from being overpowered by men.",
        reference: "Bukhari",
      },
      {
        id: "p2",
        title: "Dua for healing",
        arabic: "اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ، اشْفِهِ وَأَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ شِفَاءً لَا يُغَادِرُ سَقَمًا",
        transliteration: "Allahumma rabban-nas, adhhibil-ba's, ishfihi wa antash-shafi, la shifa'a illa shifa'uk, shifa'an la yughadiru saqama",
        translation: "O Allah, Lord of mankind, remove the harm. Heal him, for You are the Healer. There is no healing except Your healing, a healing that leaves no illness behind.",
        reference: "Bukhari, Muslim",
      },
      {
        id: "p3",
        title: "Ayatul Kursi",
        arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ",
        transliteration: "Allahu la ilaha illa huwal-hayyul-qayyum, la ta'khudhuhu sinatun wa la nawm, lahu ma fis-samawati wa ma fil-ard",
        translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth.",
        reference: "Qur'an 2:255",
      },
    ],
  },
  {
    id: "forgiveness",
    name: "Forgiveness & Repentance",
    icon: "💚",
    duas: [
      {
        id: "f1",
        title: "Sayyidul Istighfar (Master supplication for forgiveness)",
        arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        transliteration: "Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana 'abduk, wa ana 'ala 'ahdika wa wa'dika mastata't, a'udhu bika min sharri ma sana't, abu'u laka bini'matika 'alayya, wa abu'u bidhanbi, faghfir li, fa innahu la yaghfirudh-dhunuba illa ant",
        translation: "O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide to Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for none forgives sin except You.",
        reference: "Bukhari",
      },
      {
        id: "f2",
        title: "Seeking forgiveness",
        arabic: "رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
        transliteration: "Rabbana zalamna anfusana wa in lam taghfir lana wa tarhamna lanakuunanna minal-khasirin",
        translation: "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
        reference: "Qur'an 7:23",
      },
    ],
  },
];
