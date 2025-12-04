import { TransportationOperatorSelfHelp } from "./self-help-transportation-operator"
import { BeneficiaryCargoOwnerSelfHelp } from "./self-help-beneficiary-cargo-owner"
import { TerminalOperatorSelfHelp } from "./self-help-terminal-operator"


export const Selfhelp = (props: { role: string }) => {

    if ('Transportation Operator' == props.role) {

        return <TransportationOperatorSelfHelp />

    } else if ('Beneficiary Cargo Owner' == props.role) {

        return <BeneficiaryCargoOwnerSelfHelp />
        
    }else if ('Terminal Operator' == props.role) {

        return <TerminalOperatorSelfHelp />
        
    }else{
        return <div></div>
    }
}


