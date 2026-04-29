import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { Calendar } from 'lucide-react';

// Initialize French locale for dayjs
dayjs.locale('fr');

/**
 * Premium MUI DatePicker with Future Year Blocking.
 * Allows users to select any past year, but restricts selection to the CURRENT year or EARLIER.
 * 
 * @param {Object} props
 * @param {dayjs.Dayjs} props.value - Selected date
 * @param {Function} props.onChange - Selection handler
 * @param {string} props.mode - 'full' (DD/MM/YYYY) or 'month' (views: year, month)
 */
const PremiumDatePicker = ({ value, onChange, mode = 'full', className = '' }) => {
  const isMonthMode = mode === 'month';
  
  // Constraint: Block future years (Selection capped at end of current year)
  // To block all future dates (including future months this year), use maxDate={dayjs()}
  const maxAllowedDate = dayjs().endOf('year');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
      <DatePicker
        value={value ? dayjs(value) : null}
        onChange={(newValue) => onChange(newValue)}
        // Control views based on mode
        views={isMonthMode ? ['year', 'month'] : ['year', 'month', 'day']}
        format={isMonthMode ? 'MMMM YYYY' : 'DD/MM/YYYY'}
        
        // CONSTRAINTS: Allow past years, but no future years
        maxDate={maxAllowedDate}
        
        slotProps={{
          textField: {
            variant: 'standard',
            InputProps: {
              disableUnderline: true,
              readOnly: true, // Prevents keyboard input that could bypass constraints
              className: `group flex items-center bg-white border border-slate-200/60 rounded-full px-6 py-3 shadow-sm hover:shadow-md hover:border-brand-500/30 transition-all duration-300 cursor-pointer ${className}`,
              startAdornment: (
                <div className="mr-3 p-1.5 rounded-lg bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                  <Calendar size={16} strokeWidth={2.5} />
                </div>
              ),
            },
            sx: {
              '& .MuiInputBase-input': {
                padding: 0,
                fontSize: '0.875rem',
                fontWeight: 900,
                color: '#1e293b', // slate-800
                textTransform: isMonthMode ? 'capitalize' : 'none',
                letterSpacing: '-0.025em',
                cursor: 'pointer',
                width: isMonthMode ? '140px' : '110px',
              },
            },
          },
          popper: {
            placement: 'bottom-end',
            sx: {
              zIndex: 9999,
              '& .MuiPaper-root': {
                marginTop: '12px',
                borderRadius: '2rem',
                border: '1px solid #f1f5f9',
                boxShadow: '0 25px 60px -15px rgba(0,0,0,0.15)',
                padding: '12px',
                overflow: 'hidden',
              },
              // Premium Calendar Styling
              '& .MuiPickersDay-root': {
                fontWeight: 700,
                borderRadius: '12px',
                '&.Mui-selected': {
                  backgroundColor: '#0f172a !important', // brand slate-900
                  boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.4)',
                },
              },
              '& .MuiPickersMonth-monthButton, & .MuiPickersYear-yearButton': {
                fontWeight: 800,
                borderRadius: '16px',
                '&.Mui-selected': {
                  backgroundColor: '#0f172a !important',
                },
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default PremiumDatePicker;