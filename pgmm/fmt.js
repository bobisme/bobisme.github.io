// Function to humanize times
export const formatTime = (timeInMs) => {
  if (timeInMs < 1000) {
    return `${timeInMs.toFixed(0)}ms`;
  } else {
    return `${(timeInMs / 1000).toFixed(2)}s`;
  }
};

// Function to format numbers with commas and abbreviations
export const formatNumber = (number) => {
  if (number < 1000) {
    return number.toString();
  } else if (number < 1_000_000) {
    return (number / 1000).toFixed(1) + "k";
  } else if (number < 1_000_000_000) {
    return (number / 1_000_000).toFixed(1) + "M";
  } else {
    return (number / 1_000_000_000).toFixed(1) + "B";
  }
};

// Function to add commas as thousands separators
export const formatWithCommas = (number) => {
  return number.toLocaleString();
};
