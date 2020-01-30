/**
 * @file Theme setup for Material-UI.
 */

import PropTypes from 'prop-types';
import React from 'react';

import { blue, orange, red } from '@material-ui/core/colors';
import createMuiTheme from '@material-ui/core/styles/createMuiTheme';
import { ThemeProvider } from '@material-ui/core/styles';

import useDarkMode from '~/hooks/useDarkMode';

const DarkAwareThemeProvider = ({ children }) => {
  const darkMode = useDarkMode();
  const baseTheme = React.useMemo(
    () =>
      createMuiTheme({
        palette: {
          type: darkMode ? 'dark' : 'light',
          primary: blue,
          secondary: darkMode ? orange : red
        }
      }),
    [darkMode]
  );
  const theme = React.useMemo(
    () => ({
      ...baseTheme,
      overrides: {
        MuiAppBar: {
          colorDefault: {
            backgroundColor: baseTheme.palette.background.paper
          }
        }
      }
    }),
    [baseTheme]
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

DarkAwareThemeProvider.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default DarkAwareThemeProvider;
