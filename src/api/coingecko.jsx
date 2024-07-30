// src/api/coingecko.jsx
import axios from 'axios';
import moment from 'moment';

const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

export const fetchCryptoPriceHistory = async (id, date) => {
  const formattedDate = moment(date, "YYYY-MM-DD").format("DD-MM-YYYY");
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/${id}/history?date=${formattedDate}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching crypto prices", error);
    throw error;
  }
};

export const fetchCryptoCoins = async () => {
  try {
    const response = await axios.get(`${COINGECKO_API_URL}/coins/markets?vs_currency=usd`);
    return response.data;
  } catch (error) {
    console.error("Error fetching crypto coins", error);
    throw error;
  }
};
