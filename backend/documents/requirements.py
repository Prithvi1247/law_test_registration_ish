from dataclasses import dataclass


@dataclass(frozen=True)
class RequiredDocument:
    document_type: str
    document_label: str


def get_required_documents(applicant) -> list[RequiredDocument]:
    """
    Central source of truth for documents required
    based on applicant details.
    """

    required: list[RequiredDocument] = []

    # Applicant photograph
    required.append(
        RequiredDocument(
            document_type="PHOTO",
            document_label="Passport-size Photograph",
        )
    )

    # NRI
    if applicant.is_nri:
        required.append(
            RequiredDocument(
                document_type="NRI_SUPPORTING_DOCUMENT",
                document_label="NRI Supporting Document",
            )
        )

    # Category
    if applicant.category == "SC":
        required.append(
            RequiredDocument(
                document_type="SC_CERTIFICATE",
                document_label="SC Certificate",
            )
        )

    elif applicant.category == "ST":
        required.append(
            RequiredDocument(
                document_type="ST_CERTIFICATE",
                document_label="ST Certificate",
            )
        )

    # Kashmiri Migrant
    if applicant.is_km:
        required.append(
            RequiredDocument(
                document_type="KM_CERTIFICATE",
                document_label="Kashmiri Migrant Certificate",
            )
        )

    # PwD
    if applicant.is_pwd:
        required.append(
            RequiredDocument(
                document_type="DISABILITY_CERTIFICATE",
                document_label="Disability Certificate",
            )
        )

        required.append(
            RequiredDocument(
                document_type="UDID_CARD",
                document_label="UDID Card",
            )
        )

    # Nagpur domicile
    if applicant.is_nagpur_domicile:
        required.append(
            RequiredDocument(
                document_type="NAGPUR_DOMICILE_CERTIFICATE",
                document_label="Nagpur Domicile Certificate",
            )
        )

    # Defence
    if applicant.is_defence:
        required.append(
            RequiredDocument(
                document_type="DEFENCE_CERTIFICATE",
                document_label="Defence Supporting Certificate",
            )
        )

    return required