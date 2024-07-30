import { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { fetchCryptoCoins, fetchCryptoPriceHistory } from "../../api/coingecko";

const CalculatorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  max-width: 500px;
  margin: auto;
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
`;

const Title = styled.h1`
  font-size: 2em;
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  width: 100%;
`;

const Input = styled.input`
  padding: 10px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
`;

const Select = styled.select`
  padding: 10px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
`;

const Result = styled.h2`
  margin-top: 20px;
  font-size: 1.5em;
`;

const Calculator = () => {
  const [buyDate, setBuyDate] = useState("");
  const [sellDate, setSellDate] = useState("");
  const [fees, setFees] = useState(0);
  const [annualIncome, setAnnualIncome] = useState(0);
  const [totalGainOrLoss, setTotalGainOrLoss] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [totalCapitalGainsTax, setTotalCapitalGainsTax] = useState(0);
  const [taxOwed, setTaxOwed] = useState(0);
  const [coins, setCoins] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState({});
  const [historicalPrices, setHistoricalPrices] = useState({
    buyPrice: 0,
    sellPrice: 0,
  });
  const [buyQuantity, setBuyQuantity] = useState(0);
  const [sellQuantity, setSellQuantity] = useState(0);

  useEffect(() => {
    const fetchCryptoAssets = async () => {
      try {
        const response = await fetchCryptoCoins();
        if (response) {
          setCoins(response);
          setSelectedCoin(response[0]); // Default to the first asset
        } else {
          throw new Error("Failed to fetch crypto assets");
        }
      } catch (error) {
        console.error("Error fetching crypto assets:", error);
      }
    };
    fetchCryptoAssets();
  }, []);

  useEffect(() => {
    const fetchHistoricalPrices = async () => {
      if (!selectedCoin.id || !buyDate || !sellDate) return;

      try {
        const buyPriceResponse = await fetchCryptoPriceHistory(
          selectedCoin.id,
          buyDate
        );
        const sellPriceResponse = await fetchCryptoPriceHistory(
          selectedCoin.id,
          sellDate
        );

        if (buyPriceResponse && sellPriceResponse) {
          setHistoricalPrices({
            buyPrice: buyPriceResponse.market_data.current_price.usd,
            sellPrice: sellPriceResponse.market_data.current_price.usd,
          });
        } else {
          throw new Error("Failed to fetch historical prices");
        }
      } catch (error) {
        console.error("Error fetching historical prices:", error);
      }
    };

    fetchHistoricalPrices();
  }, [selectedCoin, buyDate, sellDate]);

  const calculateGainLoss = useCallback(() => {
    const { buyPrice, sellPrice } = historicalPrices;
    console.log("Calculating gain/loss with:", { buyPrice, sellPrice, buyQuantity, sellQuantity, fees });
    if (!buyPrice || !sellPrice || buyQuantity <= 0 || sellQuantity <= 0) {
      setTotalGainOrLoss(0);
      return;
    }

    const buyTotal = buyPrice * buyQuantity;
    const sellTotal = sellPrice * sellQuantity;
    const gainLoss = sellTotal - buyTotal - fees;

    console.log("Gain/Loss Calculated:", gainLoss); // Debugging line
    setTotalGainOrLoss(parseFloat(gainLoss.toFixed(2)));
  }, [historicalPrices, fees, buyQuantity, sellQuantity]);

  useEffect(() => {
    calculateGainLoss();
  }, [calculateGainLoss]);

  const calculateTax = useCallback(() => {
    if (totalGainOrLoss <= 0) {
      setTotalCapitalGainsTax(0);
      setTaxOwed(0);
      return;
    }

    let taxPercentage = 0;
    if (annualIncome > 18200) {
      taxPercentage = 19;
      if (annualIncome > 45001) {
        taxPercentage = 32.5;
      }
      if (annualIncome > 120001) {
        taxPercentage = 37;
      }
      if (annualIncome > 180001) {
        taxPercentage = 45;
      }
    }

    setTaxRate(taxPercentage);

    let totalTax = (totalGainOrLoss * taxPercentage) / 100;
    setTotalCapitalGainsTax(parseFloat(totalTax.toFixed(2)));

    // Assume some deductions or adjustments for simplicity
    const deductions = 1000; // Example deduction
    const adjustedTax = totalTax - deductions;
    setTaxOwed(Math.max(0, adjustedTax.toFixed(2))); // Tax owed can't be negative

    console.log("Tax Calculated:", { totalCapitalGainsTax, taxOwed }); // Debugging line
  }, [totalGainOrLoss, annualIncome, totalCapitalGainsTax, taxOwed]);

  useEffect(() => {
    calculateTax();
  }, [totalGainOrLoss, annualIncome, taxRate, calculateTax]);

  const handleAssetChange = (e) => {
    const selectedCoinId = e.target.value;
    const selectedCoinData = coins.find((coin) => coin.id === selectedCoinId);
    setSelectedCoin(selectedCoinData || {});
  };

  const handleBuyDateChange = (e) => {
    setBuyDate(e.target.value);
  };

  const handleSellDateChange = (e) => {
    setSellDate(e.target.value);
  };

  const handleBuyQuantityChange = (e) => {
    setBuyQuantity(parseFloat(e.target.value));
  };

  const handleSellQuantityChange = (e) => {
    setSellQuantity(parseFloat(e.target.value));
  };

  return (
    <CalculatorContainer>
      <Title>Crypto Tax Calculator</Title>
      <Label>
        Select Asset:
        <Select value={selectedCoin.id || ''} onChange={handleAssetChange}>
          {coins.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {asset.name}
            </option>
          ))}
        </Select>
      </Label>
      {selectedCoin.current_price && (
        <Result>Current Price: ${selectedCoin.current_price}</Result>
      )}
      <Label>
        Buy Date:
        <Input
          type="date"
          value={buyDate}
          onChange={handleBuyDateChange}
          placeholder="Buy Date"
        />
      </Label>
      <Label>
        Sell Date:
        <Input
          type="date"
          value={sellDate}
          onChange={handleSellDateChange}
          placeholder="Sell Date"
        />
      </Label>
      <Label>
        Buy Quantity:
        <Input
          type="number"
          min={0}
          value={buyQuantity}
          onChange={handleBuyQuantityChange}
          placeholder="Buy Quantity"
        />
      </Label>
      <Label>
        Sell Quantity:
        <Input
          type="number"
          min={0}
          value={sellQuantity}
          onChange={handleSellQuantityChange}
          placeholder="Sell Quantity"
        />
      </Label>
      <Label>
        Annual Income:
        <Input
          type="number"
          min={0}
          value={annualIncome}
          onChange={(e) => setAnnualIncome(parseFloat(e.target.value))}
          placeholder="Annual Income"
        />
      </Label>
      <Label>
        Fees:
        <Input
          type="number"
          min={0}
          value={fees}
          onChange={(e) => setFees(parseFloat(e.target.value))}
          placeholder="Fees"
        />
      </Label>
      <Result>Total Gain or Loss: ${totalGainOrLoss}</Result>
      <Result>Tax Rate: {taxRate}%</Result>
      <Result>Total Capital Gains Tax You Will Pay: ${totalCapitalGainsTax}</Result>
      <Result>Tax Owed: ${taxOwed}</Result>
    </CalculatorContainer>
  );
};

export default Calculator;
