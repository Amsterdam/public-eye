import { createMuiTheme } from '@material-ui/core/styles'
import red from '@material-ui/core/colors/red'

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#1a2871',
    },
    secondary: {
      main: red[700],
    },
  },
  typography: {
    body1: {
      fontSize: '0.75rem',
    },
    body2: {
      fontSize: '0.7rem',
    },
    button: {
      fontSize: '0.79rem',
    },
  },
  overrides: {
    MuiButton: {
      root: {
        borderRadius: 2,
      },
    },
    MuiTab: {
      root: {
        minWidth: '140px !important', // a number of your choice
        width: 140,
      },
    },
  },
})

export default theme
