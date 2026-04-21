import { createTheme } from '@mui/material/styles';

export const GLOBAL_MUI_THEME = createTheme({
  palette: {
    resume: {
      50: '#EEF3FF',
      100: '#DCE8FF',
      200: '#C2D7FF',
      300: '#9DBEFF',
      400: '#7B9DFF',
      500: '#5F7CFA',
      600: '#4F66D9',
      700: '#3D4FAF',
      800: '#2C3B7D',
      900: '#1D2858',
    },
    primary: {
      main: '#2C3B7D',
    },
  },
  components: {
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '& > .MuiSwitch-thumb': {
            backgroundColor: '#FFFFFF',
          },
          '&.Mui-checked > .MuiSwitch-thumb': {
            backgroundColor: '#59748F', // resume 500 variant
          },
          '& + .MuiSwitch-track': {
            backgroundColor: '#C7D6E4', // resume 100 variant
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#C7D6E4', // resume 100 variant
          },
        },
      },
    },
  },
});

declare module '@mui/material/styles' {
  interface Palette {
    resume: Palette['grey'];
  }

  // allow configuration using `createTheme`
  interface PaletteOptions {
    resume?: PaletteOptions['grey'];
  }
}
