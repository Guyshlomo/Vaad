import React from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'label';
  color?: string;
  weight?: 'regular' | 'medium' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export const Typography: React.FC<TypographyProps> = ({ 
  children, 
  variant = 'body', 
  color, 
  weight = 'regular', 
  align,
  style, 
  ...props 
}) => {
  const { theme } = useTheme();

  const getStyle = (): TextStyle => {
    let fontSize = 16;
    let fontWeight: TextStyle['fontWeight'] = '400';
    let marginBottom = 0;
    const isHeading = variant === 'h1' || variant === 'h2' || variant === 'h3';

    switch (variant) {
      case 'h1':
        fontSize = 28;
        fontWeight = '700';
        marginBottom = 16;
        break;
      case 'h2':
        fontSize = 24;
        fontWeight = '600';
        marginBottom = 12;
        break;
      case 'h3':
        fontSize = 20;
        fontWeight = '600';
        marginBottom = 8;
        break;
      case 'body':
        fontSize = 16;
        marginBottom = 4;
        break;
      case 'label':
        fontSize = 14;
        fontWeight = '500';
        marginBottom = 4;
        break;
      case 'caption':
        fontSize = 12;
        break;
    }

    if (weight === 'bold') fontWeight = '700';
    if (weight === 'medium') fontWeight = '500';
    if (weight === 'regular') fontWeight = '400';

    return {
      fontSize,
      fontWeight,
      fontFamily: 'sf-pro-display-thin',
      color: color || theme.text,
      // Hebrew UI defaults
      textAlign: align ?? 'right',
      writingDirection: 'rtl',
      marginBottom,
    };
  };

  return (
    <Text style={[getStyle(), style]} {...props}>
      {children}
    </Text>
  );
};

