import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, Instagram, Youtube, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useSupabase } from '@/contexts/SupabaseContext';
import TikTokIcon from '@/components/icons/TikTokIcon';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [contactInfo, setContactInfo] = useState([]);
  const { supabase } = useSupabase();

  useEffect(() => {
    const fetchFooterData = async () => {
      if (!supabase) {
        console.warn('Supabase client not initialized - footer will use minimal data');
        return;
      }

      try {
        const [policiesResponse, contactResponse] = await Promise.all([
          supabase.from('policies').select('*').eq('is_active', true),
          supabase.from('contact_info').select('*').eq('is_active', true).filter('type', 'eq', 'social').order('display_order', { ascending: true })
        ]);

        if (policiesResponse.error) throw policiesResponse.error;
        if (contactResponse.error) throw contactResponse.error;

        setPolicies(policiesResponse.data || []);
        setContactInfo(contactResponse.data || []);
      } catch (error) {
        // Silently handle network errors - footer will still render with empty data
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
          console.debug('Network error - unable to fetch footer data, continuing with defaults');
        } else {
          console.error('Error fetching footer data:', error?.message || error);
        }
        // Policies and contact info will remain as empty arrays, footer will still render
      }
    };

    fetchFooterData();
  }, [supabase]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      toast({ title: "بريد إلكتروني غير صالح", description: "يرجى إدخال عنوان بريد إلكتروني صالح.", variant: "destructive" });
      return;
    }
    setIsSubscribing(true);
    
    try {
      const { data: existingSubscriber, error: checkError } = await supabase
        .from('subscribers')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingSubscriber) {
        toast({ title: "أنت مشترك بالفعل!", description: "هذا البريد الإلكتروني موجود في قائمتنا البريدية.", variant: "default" });
        setEmail('');
        return;
      }

      const { error: insertError } = await supabase
        .from('subscribers')
        .insert({ email: email });

      if (insertError) throw insertError;
      
      toast({
        title: "تم الاشتراك بنجاح!",
        description: "شكراً لك على انضمامك لنشرتنا الإخبارية.",
      });
      setEmail('');

    } catch (error) {
      console.error('Subscription error:', error?.message || error);
      toast({
        title: "خطأ في الاشتراك",
        description: "لم نتمكن من إضافتك. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const getSocialIcon = (iconField, titleField) => {
    const iconProps = { className: "h-7 w-7 stroke-current stroke-[1.5]", strokeWidth: 1.5 };

    // Use icon field first, fallback to title for backward compatibility
    const iconName = (iconField || titleField || '').toLowerCase();

    if (iconName.includes('tiktok')) return <TikTokIcon {...iconProps} />;
    if (iconName.includes('instagram')) return <Instagram {...iconProps} />;
    if (iconName.includes('facebook')) return <Facebook {...iconProps} />;
    if (iconName.includes('youtube')) return <Youtube {...iconProps} />;
    if (iconName.includes('whatsapp') || iconName.includes('whats')) return <MessageCircle {...iconProps} />;
    if (iconName.includes('email') || iconName.includes('gmail')) return <Mail {...iconProps} />;
    return null;
  };

  return (
    <footer className="glass-effect border-t border-pink-200/30 mt-16" style={{ backgroundColor: "#feecf0" }}>
      <div className="container mx-auto px-4 py-8" style={{ backgroundColor: "rgb(254, 236, 240)" }}>
        <div className="text-center mb-8">
          <h3 className="text-[#1A1A1A] text-xl font-bold mb-4">
            اشترك في نشرتنا الإخبارية - كن أول من يعرف عن المنتجات الجديدة والعروض الحصرية
          </h3>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="أدخل بريدك الإلكتروني"
              className="flex-1 px-4 py-2 rounded-lg bg-white border border-pink-200 text-[#1A1A1A] placeholder-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-pink-400"
              style={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
              required
              disabled={isSubscribing}
            />
            <Button type="submit" className="gradient-bg hover:opacity-90 text-white" disabled={isSubscribing}>
              {isSubscribing ? 'جاري الاشتراك...' : 'اشتراك'}
            </Button>
          </form>
        </div>

        <div className="flex justify-center gap-8 mb-8">
          {contactInfo
            .filter((social) => social.url && social.url.trim() !== '')
            .map((social) => (
              <motion.a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF2F92] hover:text-[#FF2F92] transition-all duration-300"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255, 47, 146, 0.4))'
                }}
                aria-label={social.title}
                whileHover={{ scale: 1.15, filter: 'drop-shadow(0 0 16px rgba(255, 47, 146, 0.6))', y: -4 }}
                whileTap={{ scale: 0.95 }}
              >
                {getSocialIcon(social.icon, social.title)}
              </motion.a>
            ))}
        </div>

        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl mx-auto">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="border-b border-pink-200/40"
              >
                <button
                  onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)}
                  className="w-full py-3 px-2 text-right hover:bg-pink-50/40 transition-colors duration-200 flex justify-between items-center group"
                >
                  <span className={`text-pink-500 transition-transform duration-300 opacity-60 group-hover:opacity-100 ${expandedPolicy === policy.id ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </span>
                  <h4 className="text-[#5A3E55] font-semibold text-sm group-hover:text-pink-500 transition-colors">
                    {policy.title}
                  </h4>
                </button>
                <AnimatePresence>
                  {expandedPolicy === policy.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 py-3 bg-pink-50/30 text-right border-t border-pink-200/20">
                        <p className="text-[#1A1A1A] text-xs leading-relaxed whitespace-pre-wrap opacity-85">
                          {policy.content}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-[#5A3E55]/60 text-sm border-t border-pink-200/30 pt-4">
          <span>© {new Date().getFullYear()} NEOMART. جميع الحقوق محفوظة.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
