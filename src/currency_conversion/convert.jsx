
import axios from "axios";
export async function ConvertCurrency(from, to) {
    try {
        const res = await axios.get(
            `/currency-convert/${from}/${to}`
        );

        return res.data.rate;
    }
    catch (err) {
        throw err;
    }
}