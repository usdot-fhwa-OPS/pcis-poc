import { TransportationOperatorSelfHelp } from "./self-help-transportation-operator"
import { BeneficiaryCargoOwnerSelfHelp } from "./self-help-beneficiary-cargo-owner"
import { TerminalOperatorSelfHelp } from "./self-help-terminal-operator"
import { useContext } from "react"
import { UserContext } from "../../AppContext"


export const Selfhelp = () => {

    const userContext = useContext(UserContext);

    if ('Transportation Operator' == userContext.role) {

        return <TransportationOperatorSelfHelp />

    } else if ('Beneficiary Cargo Owner' == userContext.role) {

        return <BeneficiaryCargoOwnerSelfHelp />
        
    }else if ('Terminal Operator' == userContext.role) {

        return <TerminalOperatorSelfHelp />
        
    }else{
        return <div></div>
    }
}



