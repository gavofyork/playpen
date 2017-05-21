import React from 'react';
import {Button, Container, Header, Label, Search, Input, Image, Icon, Form, Dropdown, Popup, Menu} from 'semantic-ui-react';
import {BigNumber} from 'bignumber.js';
import {Bond} from 'oo7';
import {ReactiveComponent, Rimg, Rspan} from 'oo7-react';
import {bonds, isNullData, interpretQuantity} from 'oo7-parity';
import {AccountIcon, AccountLabel, AddressInputBond, InlineAccount, BondedForm,
	BButton, InputBond, HashBond, URLBond, TransactButton,
	TransactionProgressLabel, SigningButton, SigningProgressLabel,
	BalanceBond, InlineBalance
} from 'parity-reactive-ui';

// TODO:
// Labels:
// Copy for AccountLabel
// BigAccountLabel
// AccountCard
// AccountQRLabel

import {options} from 'oo7-parity';

export class App extends React.Component {
	constructor () {
		super();
		this.bond = new Bond;
		this.addrBond = new Bond;
		this.balBond = new Bond;
		this.activeItem = null;
		this.state = {names: []};
		bonds.registry.names.then(n => this.setState({names: n}));

		window.api = options.api;
		window.bonds = bonds;
		window.interpretQuantity = interpretQuantity;
		window.BigNumber = BigNumber;
	}
	render () {
		return (<Container>
			<Header as='h1'>Hello world!</Header>
			<BalanceBond bond={this.balBond}/> I would like <InlineBalance value={this.balBond}/> (<Rspan>{this.balBond.map(_=>+_)}</Rspan>)
			<br/>
			<TransactionProgressLabel value={{estimating: 1}} />
			<TransactionProgressLabel value={{requested: 1}} />
			<TransactionProgressLabel value={{signed: 1}} />
			<TransactionProgressLabel value={{confirmed: 1}} />
			<TransactionProgressLabel value={{failed: {code: -32015}}} />
			<TransactionProgressLabel value={{failed: {code: -32040}}} />

			<br/>
			<SigningProgressLabel value={{requested: 1}} />
			<SigningProgressLabel value={{signed: 1}} />
			<SigningProgressLabel value={{failed: 1}} />

			<br />
			<TransactButton content='Hello' tx={{to: bonds.me, value: '69420000000000000000'}}/>
			<TransactButton color='blue' content='Hello' tx={{to: bonds.me}} statusText={true}/>
			<TransactButton color='black' content='Hello' tx={{to: bonds.me}} colorPolicy='both'/>
			<TransactButton color='grey' content='World' tx={{to: bonds.me}} statusIcon={false} statusText={true} colorPolicy='status'/>

			<br/>
			<SigningButton content='Sign Hello' message='Hello world!'/>

			<div style={{marginTop: '1em'}}>
				My current account is <AccountLabel address={bonds.me}/> whereas the Sol account is
				<AccountLabel address={'0x00379ed52b6e8fc71ca6277a4fb99de6d38da6bb'}/>. On the other hand,
				<AccountLabel address={'0x001f2f055df43066bc9e97bb1faa6939e24fa97b'}/> is an unidentified account.
			</div>

			<div style={{marginTop: '1em'}}>
				My current account is <InlineAccount address={bonds.me}/> whereas the Sol account
				is <InlineAccount address={'0x00379ed52b6e8fc71ca6277a4fb99de6d38da6bb'}/>. On the other hand,
				<InlineAccount address={'0x001f2f055df43066bc9e97bb1faa6939e24fa97b'}/> is an unidentified account.
			</div>

			<BButton content={bonds.height.map(x => ''+x)} primary />
			<br/>
			<AddressInputBond bond={this.addrBond} />: <AccountLabel address={this.addrBond}/>
			This is it: <Rspan>{this.addrBond}</Rspan>
			<br/>
			URL lookup: <HashBond bond={this.bond} /><br/>
			<Rspan>{bonds.githubhint.entries(this.bond)[0]}</Rspan>
		</Container>);
	}
}
