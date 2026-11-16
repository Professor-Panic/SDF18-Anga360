# import os
# import serpapi
# 
# 
# def get_live_flights(origin, destination, outbound_date, return_date=None):
#     # Load the SerpApi key from environment variables (.env) to keep credentials secure
#     api_key = os.getenv("SERPAPI_KEY")
#     if not api_key:
#         raise ValueError("SERPAPI_KEY environment variable is missing.")
# 
#     # Initialize the SerpApi client
#     client = serpapi.Client(api_key=api_key)
# 
#     # Configure base search parameters for the Google Flights engine
#     params = {
#         "engine": "google_flights",                        # The specific search engine to use
#         "hl": "en",                                        # Sets the interface language to English
#         "gl": "us",                                        # Country localization for search results
#         "departure_id": origin.upper(),                    # Normalize airport code to uppercase
#         "arrival_id": destination.upper(),                 # Normalize airport code to uppercase
#         "outbound_date": outbound_date,                    # Format: YYYY-MM-DD
#         "currency": "USD",                                 # Return pricing in USD
#         "no_cache": "true"                                 # Bypass cache to ensure live pricing/availability
#     }
# 
#     # Determine trip type dynamically based on whether a return date is provided
#     if return_date:
#         params["return_date"] = return_date
#         params["type"] = 1  # SerpApi code 1 = Round trip
#     else:
#         params["type"] = 2  # SerpApi code 2 = One way
# 
#     # Execute the search query against SerpApi and convert response to a Python dict
#     results = client.search(params)
#     return results.as_dict()