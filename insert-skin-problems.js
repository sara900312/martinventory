import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykyzviqwscrjjkucorlp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreXp2aXF3c2NyamprdWNvcmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzA1NjcsImV4cCI6MjA3OTI0NjU2N30.sXpyumNFfZ_bqqZt28LOQQjDM040y7R-9-jIXy_KIps';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const skinProblemsData = [
  {
    id: 'acne',
    name_ar: 'حب الشباب',
    name_en: 'Acne',
    emoji: '🌑',
    description: 'ظهور حب الشباب ومشاكل البشرة الملتهبة',
    card_image_url: 'https://i.pinimg.com/736x/e4/01/df/e401df8bc2668a9146e99b04035d9594.jpg',
    morning_image_url: 'https://i.pinimg.com/736x/44/b0/4e/44b04e387886a5b5e51a4fe05352fdcd.jpg',
    evening_image_url: 'https://i.pinimg.com/736x/43/1d/6c/431d6c73f106f5b489ea11b65600f168.jpg',
    special_care_image_url: 'https://i.pinimg.com/736x/43/1d/6c/431d6c73f106f5b489ea11b65600f168.jpg'
  },
  {
    id: 'dark_spots',
    name_ar: 'البقع الداكنة',
    name_en: 'Dark Spots',
    emoji: '🏜️',
    description: 'تصبغات وبقع داكنة على البشرة',
    card_image_url: '',
    morning_image_url: '',
    evening_image_url: '',
    special_care_image_url: ''
  },
  {
    id: 'dryness',
    name_ar: 'جفاف البشرة',
    name_en: 'Dryness',
    emoji: '💧',
    description: 'ترطيب البشرة الجافة والحفاظ عليها',
    card_image_url: '',
    morning_image_url: '',
    evening_image_url: '',
    special_care_image_url: ''
  },
  {
    id: 'oily_skin',
    name_ar: 'البشرة الدهنية',
    name_en: 'Oily Skin',
    emoji: '🌸',
    description: 'التحكم في إفراز الزيوت وتقليل اللمعان',
    card_image_url: '',
    morning_image_url: '',
    evening_image_url: '',
    special_care_image_url: ''
  },
  {
    id: 'sensitivity',
    name_ar: 'البشرة الحساسة',
    name_en: 'Sensitivity',
    emoji: '〰️',
    description: 'تهدئة البشرة الحساسة وحمايتها',
    card_image_url: '',
    morning_image_url: '',
    evening_image_url: '',
    special_care_image_url: ''
  },
  {
    id: 'wrinkles',
    name_ar: 'التجاعيد',
    name_en: 'Wrinkles',
    emoji: '🌀',
    description: 'مكافحة التجاعيد وعلامات تقدم السن',
    card_image_url: '',
    morning_image_url: '',
    evening_image_url: '',
    special_care_image_url: ''
  }
];

async function insertSkinProblems() {
  try {
    console.log('Starting to insert skin problems data...');
    
    // First, let's check if the table exists and has data
    const { data: existingData, error: checkError } = await supabase
      .from('skin_problems')
      .select('id,name_ar,name_en,emoji,description,card_image_url,morning_image_url,evening_image_url,special_care_image_url')
      .order('name_ar', { ascending: true });

    if (checkError) {
      console.error('Error checking existing data:', checkError);
      return;
    }

    console.log('Existing skin problems:', existingData.length);

    // Delete existing data if any
    if (existingData.length > 0) {
      const { error: deleteError } = await supabase
        .from('skin_problems')
        .delete()
        .neq('id', '');

      if (deleteError) {
        console.error('Error deleting existing data:', deleteError);
        return;
      }
      console.log('Deleted existing skin problems data');
    }

    // Insert new data
    const { data, error } = await supabase
      .from('skin_problems')
      .insert(skinProblemsData);

    if (error) {
      console.error('Error inserting skin problems:', error);
      return;
    }

    console.log('✅ Successfully inserted skin problems data!');
    console.log('Inserted records:', data?.length || skinProblemsData.length);

    // Verify the insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('skin_problems')
      .select('id,name_ar,name_en,emoji,description,card_image_url,morning_image_url,evening_image_url,special_care_image_url')
      .order('name_ar', { ascending: true });

    if (verifyError) {
      console.error('Error verifying data:', verifyError);
      return;
    }

    console.log('Verification - Total skin problems in database:', verifyData.length);
    verifyData.forEach(problem => {
      console.log(`  - ${problem.emoji} ${problem.name_ar} (${problem.name_en})`);
    });

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

insertSkinProblems();
