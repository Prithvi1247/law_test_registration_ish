TEST_FEE_INR = 2550
PROGRAMME_REGISTRATION_FEE_INR = 1000


def calculate_amount_payable(number_of_selected_test_dates: int) -> int:
    if number_of_selected_test_dates <= 0:
        return 0
    return PROGRAMME_REGISTRATION_FEE_INR + (TEST_FEE_INR * number_of_selected_test_dates)