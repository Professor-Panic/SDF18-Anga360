
import { useState, useEffect } from "react";
import { ConvertCurrency } from "./convert";

const currencies = ["USD", "KES", "EUR", "GBP", "JPY", "AUD", "CAD"];
export default function CurrencyConverter() {
    const [from, setFrom] = useState("USD");
    const [to, setTo] = useState("KES");
    const [rate, setRate] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchRate() {
            try {
                setError(null);
                setRate(null);

                const result = await ConvertCurrency(from, to);
                setRate(result);
            }
            catch (err) {
                setError(err.response?.data?.message || err.message);
            }
        }

        fetchRate();
    }, [from, to]);

    return (
        <div>
            <label>
                From:
                <select value={from} onChange={e => setFrom(e.target.value)}>
                    {currencies.map(currency => (
                        <option key={currency} value={currency}>
                            {currency}
                        </option>
                    ))}
                </select>
            </label>

            <br />

            <label>
                To:
                <select value={to} onChange={e => setTo(e.target.value)}>
                    {currencies.map(currency => (
                        <option key={currency} value={currency}>
                            {currency}
                        </option>
                    ))}
                </select>
            </label>

            <p>
                {error
                    ? `Error: ${error}`
                    : rate !== null
                        ? `1 ${from} = ${rate} ${to}`
                        : "Loading..."}
            </p>
        </div>
    );
}