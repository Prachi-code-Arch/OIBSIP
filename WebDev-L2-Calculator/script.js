const expressionEl = document.getElementById('expression');
const currentEl = document.getElementById('current');
const buttons = document.querySelectorAll('.btn');
let state = {
  firstOperand: null,      
  operator: null,          
  secondOperand: null,    
  currentInput: '0',     
  waitingForSecondOperand: false, 
  justCalculated: false,  
};

function updateDisplay() {
  currentEl.textContent = state.currentInput;

  if (state.operator && !state.waitingForSecondOperand) {
   
    expressionEl.textContent = `${state.firstOperand} ${state.operator}`;
  } else if (state.operator) {
    expressionEl.textContent = `${state.firstOperand} ${state.operator}`;
  } else {
    expressionEl.textContent = '';
  }
}


function inputDigit(digit) {
  if (state.waitingForSecondOperand || state.justCalculated) {
   
    state.currentInput = digit;
    state.waitingForSecondOperand = false;
    state.justCalculated = false;
  } else {
    
    state.currentInput =
      state.currentInput === '0' ? digit : state.currentInput + digit;
  }
}

function inputDecimal() {
  if (state.waitingForSecondOperand || state.justCalculated) {
    state.currentInput = '0.';
    state.waitingForSecondOperand = false;
    state.justCalculated = false;
    return;
  }
 
  if (!state.currentInput.includes('.')) {
    state.currentInput += '.';
  }
}

function handleOperator(nextOperator) {
  const inputValue = parseFloat(state.currentInput);

  if (state.operator && state.waitingForSecondOperand) {

    state.operator = nextOperator;
    return;
  }

  if (state.firstOperand === null) {
    state.firstOperand = inputValue;
  } else if (state.operator) {
    const result = calculate(state.firstOperand, inputValue, state.operator);
    if (result === 'ERROR') {
      showError('Cannot divide by zero');
      return;
    }
    state.currentInput = String(result);
    state.firstOperand = result;
  }
  state.waitingForSecondOperand = true;
  state.operator = nextOperator;
  state.justCalculated = false;
}

function calculate(first, second, operator) {
  switch (operator) {
    case '+':
      return first + second;
    case '−':        
      return first - second;
    case '×':        
      return first * second;
    case '÷':
      if (second === 0) return 'ERROR';
      return first / second;
    default:
      return second;
  }
}

function handleEquals() {
  if (state.operator === null || state.waitingForSecondOperand) {
    return;
  }

  const inputValue = parseFloat(state.currentInput);
  const result = calculate(state.firstOperand, inputValue, state.operator);

  if (result === 'ERROR') {
    showError('Cannot divide by zero');
    return;
  }

  state.currentInput = String(round(result));
  state.firstOperand = null;
  state.operator = null;
  state.secondOperand = null;
  state.waitingForSecondOperand = false;
  state.justCalculated = true;
}

function round(num) {
  return Math.round((num + Number.EPSILON) * 1e10) / 1e10;
}

function handleClear() {
  state = {
    firstOperand: null,
    operator: null,
    secondOperand: null,
    currentInput: '0',
    waitingForSecondOperand: false,
    justCalculated: false,
  };
}

function handleBackspace() {
  if (state.waitingForSecondOperand || state.justCalculated) return;
  state.currentInput =
    state.currentInput.length > 1 ? state.currentInput.slice(0, -1) : '0';
}

function showError(message) {
  currentEl.textContent = message;
  expressionEl.textContent = '';
  handleClear();
  state.currentInput = '0';
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const { action, value } = button.dataset;
    switch (action) {
      case 'number':
        inputDigit(value);
        break;
      case 'decimal':
        inputDecimal();
        break;
      case 'operator':
        handleOperator(value);
        break;
      case 'equals':
        handleEquals();
        break;
      case 'clear':
        handleClear();
        break;
      case 'backspace':
        handleBackspace();
        break;
    }

    updateDisplay();
  });
});

updateDisplay();