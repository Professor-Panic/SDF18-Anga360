from services import fast_flights_source


def get_live_flights(origin, destination, outbound_date, return_date=None,
                     cabin="economy", currency="USD"):
    return fast_flights_source.search(origin, destination, outbound_date,
                                      return_date, cabin, currency)
