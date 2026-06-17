import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sun, Moon, Sparkles, X } from 'lucide-react';

const routineTypesData = [
  {
    id: 'morning',
    title: '🌅 الروتين الصباحي',
    icon: Sun,
    description: 'روتين صباحي منعش يبدأ يومك بطريقة صحيحة. يتضمن تنظيفاً لطيفاً وحماية يومية من الشمس والعوامل الخارجية.',
    steps: [
      'تنظيف لطيف يومي',
      'تونر أو مرطب خفيف',
      'كريم حماية من الشمس',
      'مرطب خفيف أو جل',
    ],
    color: 'from-yellow-400 to-orange-400',
    accentColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    id: 'night',
    title: '🌙 الروتين الليلي',
    icon: Moon,
    description: 'روتين عميق وفعال للعناية الليلية. يركز على التغذية العميقة والإصلاح أثناء النوم للحصول على بشرة منتعشة صباحاً.',
    steps: [
      'مزيل مكياج أو زيت منظف',
      'غسول ليلي معمق',
      'سيرم أو مصل علاجي',
      'كريم ليلي غني ومرطب',
    ],
    color: 'from-indigo-400 to-blue-400',
    accentColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    id: 'special',
    title: '✨ الروتين الخاص والعلاجات المكثفة',
    icon: Sparkles,
    description: 'علاجات متقدمة وقوية للحالات الخاصة. تستخدم 1-2 مرات أسبوعياً لتعزيز فعالية الروتين اليومي ومعالجة المشاكل المحددة.',
    steps: [
      'أقنعة معالجة متخصصة',
      'مقشرات كيميائية أو فيزيائية',
      'علاجات موضعية مركزة',
      'منتجات إصلاح مكثفة',
    ],
    color: 'from-purple-400 to-pink-400',
    accentColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

const tipsData = [
  'الاستمرارية هي المفتاح: استخدمي المنتجات بانتظام لمدة 6-8 أسابيع لرؤية نتائج واضحة',
  'اختبري قبل الاستخدام: ابدئي بكمية صغيرة على منطقة صغيرة أولاً',
  'الترطيب ضروري: شربي الماء بكثرة وحافظي على ترطيب البشرة من الداخل والخارج',
  'الحماية من الشمس: استخدمي واقي شمس يومياً حتى في الأيام الغائمة',
  'العادات الصحية: نومك المنتظم والغذاء الصحي يعكسان على بشرتك بشكل مباشر',
];

export const RoutineTypesInfoDialog = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-right">
          <DialogTitle className="text-2xl">ℹ️ معلومات عن أنواع الروتينات</DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Routine Types */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {routineTypesData.map((routine, index) => {
              const Icon = routine.icon;
              return (
                <motion.div
                  key={routine.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 rounded-2xl border-2 border-gray-200 ${routine.bgColor}`}
                >
                  {/* Title with icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <Icon className={`w-6 h-6 ${routine.accentColor}`} />
                    <h3 className="text-xl font-bold text-gray-900">{routine.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 text-right">{routine.description}</p>

                  {/* Steps */}
                  <div className="space-y-3">
                    {routine.steps.map((step, stepIndex) => (
                      <motion.div
                        key={stepIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + stepIndex * 0.05 }}
                        className="flex items-center gap-3 text-right"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${routine.bgColor} border-2 border-current ${routine.accentColor}`}>
                          <svg className={`w-4 h-4 ${routine.accentColor}`} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl border-2 border-pink-200"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💡</span>
              <h3 className="text-xl font-bold text-gray-900">نصائح ذهبية للعناية:</h3>
            </div>
            <ul className="space-y-3">
              {tipsData.map((tip, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-start gap-3 text-right"
                >
                  <span className="text-pink-600 font-bold mt-1">•</span>
                  <span className="text-gray-700">{tip}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
