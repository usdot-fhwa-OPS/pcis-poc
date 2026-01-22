import { TransportationOperatorSelfHelp } from "./self-help-transportation-operator"
import { BeneficiaryCargoOwnerSelfHelp } from "./self-help-beneficiary-cargo-owner"
import { TerminalOperatorSelfHelp } from "./self-help-terminal-operator"
import { useContext } from "react"
import { UserContext } from "../../AppContext"


export const Selfhelp = () => {

    const userContext = useContext(UserContext);
    const userRole = userContext["custom:role"];

    if ((userRole === 'Trucking Operator') 
          || (userRole === 'Rail Operator')
          || (userRole === 'Third Party Logistics Provider')) {

        return <TransportationOperatorSelfHelp />

    } else if ('Beneficiary Cargo Owner' == userRole) {

        return <BeneficiaryCargoOwnerSelfHelp />

    } else if ('Terminal Operator' == userRole) {

        return <TerminalOperatorSelfHelp />

    } else {
        return <div></div>
    }
}



