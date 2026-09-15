import React from 'react';
import { Box, Card, Typography, LinearProgress } from '@mui/material';
import { TrendingUpRounded } from '@mui/icons-material';

const StatCard = ({
  title,
  value,
  helper,
  icon,
  color = '#2563eb',
  bg = '#eff6ff',
  borderColor = 'rgba(37,99,235,0.2)',
  badge = null,
  progress = null,
  onClick = null,
}) => {
  return (
    <Card
      onClick={onClick}
      sx={{
        p: { xs: 2.25, sm: 2.5 },
        height: '100%',
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#ffffff',
        background: 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
        border: '1px solid #e2e8f0',
        borderTop: '1px solid #e2e8f0 !important',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 240ms cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&:hover': {
          transform: 'translateY(-3px)',
          borderColor: '#cbd5e1',
          borderTopColor: '#cbd5e1 !important',
          boxShadow: '0 18px 34px -24px rgba(15,23,42,0.24)',
        },
        '&::before, &::after': {
          display: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header Row: Icon + Badge / Trend */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '13px',
              bgcolor: bg,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${borderColor}`,
              boxShadow: `0 4px 12px -2px ${color}20`,
              flexShrink: 0,
              '& svg': { fontSize: '1.4rem' },
            }}
          >
            {icon}
          </Box>

          {badge ? (
            <Box
              sx={{
                px: 1.25,
                py: 0.4,
                borderRadius: '999px',
                bgcolor: badge.bg || bg,
                color: badge.color || color,
                border: `1px solid ${badge.borderColor || borderColor}`,
                fontSize: '0.725rem',
                fontWeight: 750,
                letterSpacing: '0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {badge.label}
            </Box>
          ) : (
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                border: '1px solid #f1f5f9',
              }}
            >
              <TrendingUpRounded sx={{ fontSize: 16 }} />
            </Box>
          )}
        </Box>

        {/* Metric Value & Title */}
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: '1.95rem', sm: '2.25rem' },
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.035em',
            lineHeight: 1.1,
            mb: 0.35,
          }}
        >
          {value}
        </Typography>

        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: '#475569',
            fontSize: '0.85rem',
            letterSpacing: '-0.01em',
            mb: 1.5,
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* Footer / Helper / Progress */}
      <Box sx={{ position: 'relative', zIndex: 1, mt: 'auto' }}>
        {typeof progress === 'number' && (
          <Box sx={{ mb: 1.25 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(Math.max(progress, 0), 100)}
              sx={{
                height: 5,
                borderRadius: 4,
                bgcolor: '#f1f5f9',
                '& .MuiLinearProgress-bar': {
                  bgcolor: color,
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.85,
            pt: 1.1,
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: color,
              flexShrink: 0,
              boxShadow: `0 0 6px ${color}`,
            }}
          />
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: '#64748b',
              fontWeight: 600,
              fontSize: '0.785rem',
            }}
          >
            {helper}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default StatCard;
