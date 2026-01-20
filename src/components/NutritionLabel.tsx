import React from 'react';
import { motion } from 'framer-motion';
import { NutritionData } from '../types';

interface NutritionLabelProps {
  data: NutritionData;
}

export const NutritionLabel: React.FC<NutritionLabelProps> = ({ data }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className="bg-[#F9F7F2] p-6 sm:p-8 border border-stone-200 shadow-sm font-mono text-stone-800 max-w-sm mx-auto relative overflow-hidden"
    >
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
      
      <div className="border-b-8 border-stone-800 pb-1 mb-1">
        <h2 className="text-3xl font-black tracking-tighter">Nutrition Facts</h2>
      </div>
      
      <div className="border-b border-stone-800 text-sm mb-1 pb-1">
        <div>Serving Size: 1 Conversation</div>
        <div className="flex justify-between font-bold">
          <span>Amount Per Chat</span>
          <span>% Daily Value*</span>
        </div>
      </div>

      <div className="border-b-4 border-stone-800 py-1 flex justify-between items-baseline">
        <span className="font-black text-xl">Calories 0</span>
        <span className="text-xs italic font-normal">Sincerity based</span>
      </div>

      <div className="space-y-1 mt-2">
        <div className="flex justify-between border-b border-stone-200 py-1">
          <span><span className="font-bold">Nonsense</span> (废话)</span>
          <span className="font-bold">{data.nonsense}%</span>
        </div>
        <div className="flex justify-between border-b border-stone-200 py-1 pl-4">
          <span>Sugar (甜度)</span>
          <span>{data.sugar}%</span>
        </div>
        <div className="flex justify-between border-b border-stone-200 py-1 pl-4">
          <span>Toxicity (毒性)</span>
          <span>{data.toxicity}%</span>
        </div>
        <div className="flex justify-between border-b-4 border-stone-800 py-1">
          <span><span className="font-bold">Sincerity</span> (真心)</span>
          <span className="font-bold">{data.sincerity}%</span>
        </div>
      </div>

      <div className="text-[10px] mt-4 leading-tight italic text-stone-500">
        * Percent Daily Values are based on a 2,000 calorie diet of emotional labor. 
        Your daily values may be higher or lower depending on your attachment style.
      </div>

      <div className="mt-6 pt-4 border-t border-stone-300 flex justify-between items-center opacity-50 text-[10px] tracking-widest uppercase">
        <span>ID: CHAT-CT-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
        <span>SCANNED: {new Date().toLocaleDateString()}</span>
      </div>
    </motion.div>
  );
};
