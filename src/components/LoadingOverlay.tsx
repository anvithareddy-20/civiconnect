import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Upload, Send } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  type?: 'default' | 'upload' | 'submit' | 'success';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  message = 'Processing...', 
  type = 'default' 
}) => {
  if (!isLoading) return null;

  const getIcon = () => {
    switch (type) {
      case 'upload':
        return <Upload className="w-8 h-8" />;
      case 'submit':
        return <Send className="w-8 h-8" />;
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-green-400" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin" />;
    }
  };

  const getAnimation = () => {
    if (type === 'success') {
      return {
        scale: [0, 1.2, 1],
        rotate: [0, 360],
      };
    }
    return {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="glass bg-card/90 p-8 rounded-2xl shadow-glow border border-primary/20 text-center"
      >
        <motion.div
          animate={getAnimation()}
          transition={{
            duration: type === 'success' ? 0.6 : 2,
            repeat: type === 'success' ? 0 : Infinity,
            ease: "easeInOut"
          }}
          className="flex justify-center mb-4 text-primary"
        >
          {getIcon()}
        </motion.div>
        
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-semibold text-foreground mb-2"
        >
          {type === 'success' ? 'Success!' : 'Please wait...'}
        </motion.h3>
        
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-muted-foreground"
        >
          {message}
        </motion.p>

        {type !== 'success' && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-4 h-1 bg-gradient-primary rounded-full origin-left"
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default LoadingOverlay;