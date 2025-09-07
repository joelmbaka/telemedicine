import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const adminAuthClient = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Same skill card templates from our seeding script
const skillCardTemplates = [
  { title: "Comprehensive Annual Physical Exams", emoji: "🩺", category: "8d66310a-4cb2-4a09-b780-c3daf60e4ca8", subcategory: "dadb010d-5c29-4ce7-a6c4-9740f3323da3", experience: [3, 8] },
  { title: "Preventive Health Screenings", emoji: "📋", category: "8d66310a-4cb2-4a09-b780-c3daf60e4ca8", subcategory: "b0c5710b-6ebb-4205-9846-6f40b40d648e", experience: [5, 12] },
  { title: "Chronic Disease Coordination", emoji: "💊", category: "8d66310a-4cb2-4a09-b780-c3daf60e4ca8", subcategory: "d5636f06-c55e-4007-957a-179fdf94238e", experience: [4, 10] },
  { title: "Geriatric Care Management", emoji: "👴", category: "8d66310a-4cb2-4a09-b780-c3daf60e4ca8", subcategory: "1cb6ffbe-29aa-4cbd-93c0-8a933806a48d", experience: [6, 15] },
  { title: "Advanced Heart Catheterization", emoji: "❤️", category: "30d48d36-40d0-4e17-8f68-7606e68211a3", subcategory: "dd714529-53b7-4e43-b8a7-129e197408ac", experience: [8, 20] },
  { title: "Heart Rhythm Disorders", emoji: "⚡", category: "30d48d36-40d0-4e17-8f68-7606e68211a3", subcategory: "6a566939-a631-4330-a768-6f51c887692a", experience: [6, 15] },
  { title: "Heart Failure Optimization", emoji: "💔", category: "30d48d36-40d0-4e17-8f68-7606e68211a3", subcategory: "eff2c87f-451a-4594-a8a8-4ac114dce2e0", experience: [5, 12] },
  { title: "Cardiac Ultrasound Imaging", emoji: "🫀", category: "30d48d36-40d0-4e17-8f68-7606e68211a3", subcategory: "5ff07af5-4d78-4dac-a11e-42ef9037c55c", experience: [4, 10] },
  { title: "Skin Cancer Detection & Biopsy", emoji: "🔍", category: "6718eeb1-203d-4b58-9f8a-b115301b9e2a", subcategory: "1fc8d631-382e-44b3-95c4-83ba490e1920", experience: [6, 15] },
  { title: "Advanced Acne & Scar Treatment", emoji: "✨", category: "6718eeb1-203d-4b58-9f8a-b115301b9e2a", subcategory: "4201865b-53d4-4371-8538-fead814fc863", experience: [4, 8] },
  { title: "Pediatric Eczema Specialists", emoji: "🧴", category: "6718eeb1-203d-4b58-9f8a-b115301b9e2a", subcategory: "9be1e969-0a75-49bc-bd1a-5b1cad626ae6", experience: [5, 12] },
  { title: "Dermatopathology Analysis", emoji: "🔬", category: "6718eeb1-203d-4b58-9f8a-b115301b9e2a", subcategory: "8e306562-e532-4768-a0e3-8e337df43e0a", experience: [8, 18] },
  { title: "Newborn Intensive Care", emoji: "👶", category: "4bbb9fce-065f-4910-8a25-bada3a36174e", subcategory: "f191f740-2936-4ab8-8614-8f9025f9d68e", experience: [6, 15] },
  { title: "Adolescent Health & Development", emoji: "🧒", category: "4bbb9fce-065f-4910-8a25-bada3a36174e", subcategory: "39a1fa53-2e70-4c08-8c38-de8ab5306273", experience: [4, 10] },
  { title: "Pediatric Heart Conditions", emoji: "💝", category: "4bbb9fce-065f-4910-8a25-bada3a36174e", subcategory: "c77be2c7-f436-4906-80f2-f90271d8daa9", experience: [8, 20] },
  { title: "Childhood Diabetes Management", emoji: "🍎", category: "4bbb9fce-065f-4910-8a25-bada3a36174e", subcategory: "52b86b8e-f352-4d4b-934a-c537deef9300", experience: [5, 12] },
  { title: "Advanced Seizure Management", emoji: "⚡", category: "21df1c35-7e2b-41a0-b237-aba2367277e3", subcategory: "07546f0b-b3c8-4f04-91e3-0dd01119c64c", experience: [6, 15] },
  { title: "Stroke Prevention & Recovery", emoji: "🧠", category: "21df1c35-7e2b-41a0-b237-aba2367277e3", subcategory: "c17a7cc3-ed59-4766-a4e4-c18d65b8e8a0", experience: [8, 18] },
  { title: "Movement Disorder Therapy", emoji: "🤝", category: "21df1c35-7e2b-41a0-b237-aba2367277e3", subcategory: "7c536cfe-eefe-4ba0-abee-7ee2a0f83f0b", experience: [7, 16] },
  { title: "Chronic Headache Solutions", emoji: "💊", category: "21df1c35-7e2b-41a0-b237-aba2367277e3", subcategory: "8c7df3a8-8faf-4020-bfb9-944722e6b210", experience: [4, 12] },
  { title: "Adult Depression & Anxiety", emoji: "🧩", category: "7169579f-5a6f-4e08-be37-98d24a6341fd", subcategory: "75c515d4-b985-4406-81aa-1e588e715d53", experience: [5, 12] },
  { title: "Child & Teen Mental Health", emoji: "🎈", category: "7169579f-5a6f-4e08-be37-98d24a6341fd", subcategory: "f7a5fe7f-9257-4b01-a3ef-2ccaab10951f", experience: [6, 14] },
  { title: "Senior Mental Health Care", emoji: "🌅", category: "7169579f-5a6f-4e08-be37-98d24a6341fd", subcategory: "5bddf03d-9380-4769-b456-5ac98dbc3d36", experience: [8, 18] },
  { title: "Addiction Recovery Programs", emoji: "🔄", category: "7169579f-5a6f-4e08-be37-98d24a6341fd", subcategory: "a4d4b79f-1b96-4de4-89b4-59b4df474c0e", experience: [7, 15] },
  { title: "Sports Medicine & Injury Prevention", emoji: "🏃", category: "e479e691-4e78-4197-8dac-0067e73460d0", subcategory: "c9f977cc-eacf-463a-b95e-11b086964b97", experience: [5, 12] },
  { title: "Spinal Surgery & Rehabilitation", emoji: "🦴", category: "e479e691-4e78-4197-8dac-0067e73460d0", subcategory: "32bb682f-8740-4662-8033-a27af9ab51db", experience: [8, 20] },
  { title: "Hand & Wrist Reconstruction", emoji: "✋", category: "e479e691-4e78-4197-8dac-0067e73460d0", subcategory: "16a1b477-ed11-4b3d-98da-6a9cc92873cd", experience: [6, 15] },
  { title: "Total Joint Replacement", emoji: "🔧", category: "e479e691-4e78-4197-8dac-0067e73460d0", subcategory: "e746d55c-a4f9-446c-9bbf-e9019945fd3d", experience: [10, 25] },
  { title: "High-Risk Pregnancy Care", emoji: "🤰", category: "b1dbef15-3257-40e9-946e-ce8230aac02d", subcategory: "755587cc-46e7-421a-81ff-65e57ba1d6e0", experience: [6, 15] },
  { title: "Fertility & IVF Treatments", emoji: "🌸", category: "b1dbef15-3257-40e9-946e-ce8230aac02d", subcategory: "e3230f65-0dbd-43c3-908b-cea0604c84f6", experience: [8, 18] },
  { title: "Gynecologic Cancer Surgery", emoji: "🎗️", category: "b1dbef15-3257-40e9-946e-ce8230aac02d", subcategory: "62dfe42f-6542-4efc-a9c6-aa8ef4b3aba9", experience: [10, 22] },
  { title: "Pelvic Floor Reconstruction", emoji: "💪", category: "b1dbef15-3257-40e9-946e-ce8230aac02d", subcategory: "00c2b688-9c9e-422f-97fe-b3c595caf485", experience: [7, 16] },
  { title: "Advanced Diabetes Technology", emoji: "📱", category: "d4b8d95c-f190-4cca-8a7a-d1f358c856fa", subcategory: "08bacdfe-0940-4394-b781-ed2f4d3bb3ec", experience: [5, 12] },
  { title: "Thyroid Disorders & Surgery", emoji: "🦋", category: "d4b8d95c-f190-4cca-8a7a-d1f358c856fa", subcategory: "81318673-88c7-478e-ad8e-54d3647d6d39", experience: [6, 14] },
  { title: "Bone Health & Osteoporosis", emoji: "🦴", category: "d4b8d95c-f190-4cca-8a7a-d1f358c856fa", subcategory: "84779a0a-c293-48d3-9592-a1ec7d283d31", experience: [7, 15] },
  { title: "Liver Disease Management", emoji: "🩻", category: "0384aa73-57d8-4925-a64e-987a765489a1", subcategory: "6850fc36-0d2f-42f2-9936-eedf0408c8dd", experience: [8, 18] },
  { title: "Sleep Apnea Treatment", emoji: "😴", category: "6237f5a3-9820-49e3-a23e-9087d0b3b825", subcategory: "6fa42d79-0871-4767-b3d1-9575cad271ce", experience: [5, 12] },
  { title: "Cancer Chemotherapy", emoji: "🎗️", category: "33196b82-b373-4da8-9160-911917623847", subcategory: "6dfd3010-3fc9-476f-82b2-2494d8e51ca3", experience: [8, 20] },
  { title: "Kidney Stone Treatment", emoji: "💧", category: "70ea103a-c43f-4cbc-a326-4d7233d0a8d0", subcategory: "ea071de2-e4dc-433b-ae34-ac04f2908344", experience: [6, 14] },
  { title: "Retinal Surgery", emoji: "👁️", category: "35c73d1c-9880-40d2-8ce5-29374b3e360c", subcategory: "58c93ed6-c7e8-4013-b107-18ae5beb4133", experience: [10, 25] },
  { title: "Hearing Loss Treatment", emoji: "👂", category: "90dc041f-ca42-40b9-b033-1e9d5eddf47a", subcategory: "4bf41220-81a0-464b-b1be-d7490bbb64b2", experience: [7, 16] },
];

// Generate realistic descriptions and engagement data
const generateDescription = (title, experience) => {
  const descriptions = [
    `Comprehensive ${title.toLowerCase()} with ${experience} years of specialized experience. Evidence-based approach with personalized treatment plans.`,
    `Expert ${title.toLowerCase()} services utilizing the latest medical advances. Focused on patient comfort and optimal outcomes.`,
    `Specialized ${title.toLowerCase()} with proven track record. Collaborative care approach with emphasis on patient education.`,
    `Advanced ${title.toLowerCase()} techniques backed by ${experience} years of clinical experience. Committed to excellence in patient care.`,
    `Professional ${title.toLowerCase()} services with compassionate care. Tailored treatment plans for individual patient needs.`,
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

const generateEngagementData = () => ({
  avg_rating: (4.2 + Math.random() * 0.8).toFixed(1),
  reviews_count: Math.floor(15 + Math.random() * 150),
  orders_count: Math.floor(25 + Math.random() * 200),
});

async function balanceSkillCards() {
  console.log('🔄 Starting skill card balance optimization...');
  
  // Get all doctors and their current skill card count
  const { data: doctors, error: doctorsError } = await adminAuthClient
    .from('doctors')
    .select(`
      id,
      skill_cards (id)
    `);
  
  if (doctorsError) {
    console.error('Error fetching doctors:', doctorsError);
    return;
  }
  
  console.log(`📊 Analyzing ${doctors.length} doctors...`);
  
  // Analyze current distribution
  const distribution = {
    zero: [],
    one: [],
    two: [],
    three: [],
    excess: []
  };
  
  doctors.forEach(doctor => {
    const cardCount = doctor.skill_cards.length;
    if (cardCount === 0) distribution.zero.push(doctor);
    else if (cardCount === 1) distribution.one.push(doctor);
    else if (cardCount === 2) distribution.two.push(doctor);
    else if (cardCount === 3) distribution.three.push(doctor);
    else distribution.excess.push(doctor);
  });
  
  console.log(`
📈 Current Distribution:
   0 cards: ${distribution.zero.length} doctors
   1 card:  ${distribution.one.length} doctors  
   2 cards: ${distribution.two.length} doctors
   3 cards: ${distribution.three.length} doctors
   >3 cards: ${distribution.excess.length} doctors
  `);
  
  let changes = 0;
  
  // Step 1: Remove excess cards (>3 per doctor)
  for (const doctor of distribution.excess) {
    const { data: skillCards } = await adminAuthClient
      .from('skill_cards')
      .select('id')
      .eq('doctor_id', doctor.id)
      .order('created_at', { ascending: true });
    
    const cardsToDelete = skillCards.slice(3); // Keep first 3, delete rest
    
    for (const card of cardsToDelete) {
      await adminAuthClient
        .from('skill_cards')
        .delete()
        .eq('id', card.id);
      changes++;
    }
    console.log(`🗑️  Removed ${cardsToDelete.length} excess cards from doctor ${doctor.id}`);
  }
  
  // Step 2: Add cards for doctors with 0 cards
  for (const doctor of distribution.zero) {
    const numCards = Math.floor(Math.random() * 3) + 1; // 1-3 cards
    const shuffledTemplates = [...skillCardTemplates].sort(() => 0.5 - Math.random());
    const selectedTemplates = shuffledTemplates.slice(0, numCards);
    
    for (const template of selectedTemplates) {
      const engagement = generateEngagementData();
      const experience = Math.floor(Math.random() * (template.experience[1] - template.experience[0] + 1)) + template.experience[0];
      
      const skillCard = {
        doctor_id: doctor.id,
        title: template.title,
        emoji: template.emoji,
        description: generateDescription(template.title, experience),
        years_experience: experience,
        avg_rating: parseFloat(engagement.avg_rating),
        reviews_count: engagement.reviews_count,
        orders_count: engagement.orders_count,
        category: null,
        category_id: template.category,
        subcategory_id: template.subcategory,
        images: null
      };
      
      const { error: insertError } = await adminAuthClient
        .from('skill_cards')
        .insert([skillCard]);
      
      if (insertError) {
        console.error(`❌ Error adding card to doctor ${doctor.id}:`, insertError.message);
      } else {
        changes++;
      }
    }
    console.log(`✅ Added ${numCards} skill cards to doctor ${doctor.id}`);
  }
  
  // Step 3: Optionally add more cards to doctors with 1-2 cards (random chance)
  const doctorsNeedingMore = [...distribution.one, ...distribution.two];
  
  for (const doctor of doctorsNeedingMore) {
    const currentCount = doctor.skill_cards.length;
    const shouldAdd = Math.random() < 0.6; // 60% chance to add more cards
    
    if (shouldAdd && currentCount < 3) {
      const maxToAdd = 3 - currentCount;
      const numToAdd = Math.floor(Math.random() * maxToAdd) + 1;
      
      const shuffledTemplates = [...skillCardTemplates].sort(() => 0.5 - Math.random());
      const selectedTemplates = shuffledTemplates.slice(0, numToAdd);
      
      for (const template of selectedTemplates) {
        const engagement = generateEngagementData();
        const experience = Math.floor(Math.random() * (template.experience[1] - template.experience[0] + 1)) + template.experience[0];
        
        const skillCard = {
          doctor_id: doctor.id,
          title: template.title,
          emoji: template.emoji,
          description: generateDescription(template.title, experience),
          years_experience: experience,
          avg_rating: parseFloat(engagement.avg_rating),
          reviews_count: engagement.reviews_count,
          orders_count: engagement.orders_count,
          category: null,
          category_id: template.category,
          subcategory_id: template.subcategory,
          images: null
        };
        
        const { error: insertError } = await adminAuthClient
          .from('skill_cards')
          .insert([skillCard]);
        
        if (insertError) {
          console.error(`❌ Error adding additional card to doctor ${doctor.id}:`, insertError.message);
        } else {
          changes++;
        }
      }
      console.log(`➕ Added ${numToAdd} additional skill cards to doctor ${doctor.id}`);
    }
  }
  
  // Final verification
  const { data: finalDoctors } = await adminAuthClient
    .from('doctors')
    .select(`
      id,
      skill_cards (id)
    `);
  
  const finalDistribution = {
    zero: 0, one: 0, two: 0, three: 0, excess: 0
  };
  
  finalDoctors.forEach(doctor => {
    const cardCount = doctor.skill_cards.length;
    if (cardCount === 0) finalDistribution.zero++;
    else if (cardCount === 1) finalDistribution.one++;
    else if (cardCount === 2) finalDistribution.two++;
    else if (cardCount === 3) finalDistribution.three++;
    else finalDistribution.excess++;
  });
  
  const totalCards = finalDoctors.reduce((sum, doc) => sum + doc.skill_cards.length, 0);
  
  console.log(`
🎯 Final Distribution:
   0 cards: ${finalDistribution.zero} doctors
   1 card:  ${finalDistribution.one} doctors  
   2 cards: ${finalDistribution.two} doctors
   3 cards: ${finalDistribution.three} doctors
   >3 cards: ${finalDistribution.excess} doctors
   
📊 Total: ${totalCards} skill cards for ${finalDoctors.length} doctors
🔄 Changes made: ${changes}
✅ Balance optimization complete!
  `);
}

balanceSkillCards().catch(console.error);
