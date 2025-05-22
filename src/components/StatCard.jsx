
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const StatCard = ({ title, value, icon: Icon, trend, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      className={cn("stat-card", className)}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend.type === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
              <span>{trend.value}</span>
              <span className="ml-1">{trend.label}</span>
            </div>
          )}
        </div>
        
        <div className="p-3 rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatCard;
