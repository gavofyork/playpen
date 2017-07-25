import React from 'react';
import {Button, Container, Header, Label, Search, Input, Image, Icon, Form,
	Statistic, Grid, Dropdown, Popup, Menu, Segment, Divider, Sidebar, Loader,
	List
} from 'semantic-ui-react';
import {BigNumber} from 'bignumber.js';
import {ecrecover, pubToAddress, bufferToHex} from 'ethereumjs-util';
import {Bond} from 'oo7';
import {Buffer} from 'buffer/';
import {ReactiveComponent, Rimg, Rspan, Rdiv} from 'oo7-react';
import {bonds, toChecksumAddress, hexToAscii, sha3, isNullData, isOwned,
	isNotOwned, interpretQuantity, formatBlockNumber
} from 'oo7-parity';
import {AccountIcon, AccountLabel, AddressBond, InlineAccount, BondedForm,
	BButton, InputBond, HashBond, URLBond, TransactButton,
	TransactionProgressLabel, SigningButton, SigningProgressLabel,
	BalanceBond, InlineBalance, BStatistic, BLabel, BLabelDetail,
options as ParityOptions} from 'parity-reactive-ui';
import moment from 'moment';

// global.fetch = require('node-fetch');

function getTxs (address) {
  console.log('getTxs', address);
  return Bond.promise([bonds.chainName])
  	.then(([n]) => n == 'foundation' ? 'api' : n)
	.then(subdom => fetch(`http://${subdom}.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc`))
  	.then(response => response.json())
    .then(result => result.result);
}

// TODO:
// Labels:
// Copy for AccountLabel
// BigAccountLabel
// AccountCard
// AccountQRLabel

const options = [
  { key: 'A', text: 'A - Primary Address', value: 'A', type: 'address' },
  { key: 'IMG', text: 'IMG - Primary Image', value: 'IMG', type: 'hash' },
  { key: 'CAPTION', text: 'CAPTION - A small description', value: 'CAPTION', type: 'string' }
]

class DropdownBond extends ReactiveComponent {
	constructor () {
		super(['disabled', 'enabled']);
	}
	componentWillMount() {
		super.componentWillMount();
		this.setState({options: this.props.options});
		this.handleChange(null, {value: this.props.defaultValue || this.props.options[0].value});
	}

	handleAddition (e, { value }) {
		this.setState({
			options: [{ text: `${value} - Custom value`, value }, ...this.props.options],
		})
	}

	handleChange (e, { value }) {
		this.setState({ currentValue: value });
		if (this.props.bond instanceof Bond) {
			if (value === null) {
				this.props.bond.reset();
			} else {
				this.props.bond.changed(value);
			}
		}
	}

	render () {
		const { currentValue } = this.state
		return (
			<Dropdown
				options={this.state.options}
				placeholder={this.props.placeholder}
				additionLabel={<i>Custom Key: </i>}
				search={this.props.search}
				selection={this.props.selection}
				allowAdditions={this.props.allowAdditions}
				value={currentValue}
				onAddItem={this.handleAddition.bind(this)}
				onChange={this.handleChange.bind(this)}
				style={this.props.style}
				disabled={!!this.state.disabled || !this.state.enabled}
			/>
		)
	}
}
DropdownBond.defaultProps = {
	placeholder: '',
	additionLabel: 'Custom',
	search: true,
	selection: true,
	allowAdditions: true,
	defaultValue: '',
	disabled: false,
	enabled: true,
	options: [{text: 'Unknown', value: ''}]
}

class MultiInputBond extends ReactiveComponent {
	constructor () {
		super(['type', 'defaultValue', 'disabled', 'enabled']);
	}

	readyRender () {
		return this.state.type === 'address' ? (<AddressBond
				bond={this.props.bond}
				placeholder={this.props.placeholder}
				defaultValue={this.state.defaultValue}
				action={this.props.action}
				disabled={this.state.disabled || !this.state.enabled}
			/>) : this.state.type === 'hash' ? (<HashBond
				bond={this.props.bond}
				placeholder={this.props.placeholder}
				defaultValue={this.state.defaultValue}
				action={this.props.action}
				disabled={this.state.disabled || !this.state.enabled}
			/>) : this.state.type === 'string' ? (<InputBond
				bond={this.props.bond}
				placeholder={this.props.placeholder}
				defaultValue={this.state.defaultValue}
				action={this.props.action}
				disabled={this.state.disabled || !this.state.enabled}
			/>) : (<span/>);
	}
}
MultiInputBond.defaultProps = {
	defaultValue: '',
	disabled: false,
	enabled: true
};

const coerce = (hash, type) => {
	if (hash.startsWith('0x')) {
		if (type === 'string') {
			return hexToAscii(hash);
		}
		if (type === 'address') {
			return toChecksumAddress(`0x${hash.substr(26)}`);
		}
	}
	return hash;
}

class SendPanel extends React.Component {
	constructor () {
		super();
		this.addrBond = new Bond;
		this.balBond = new Bond;
	}

	render () {
		return (<div style={{textAlign: 'center'}}>
			<AddressBond bond={this.addrBond}/>
			<Divider hidden />
			<BalanceBond bond={this.balBond}/>
			<Divider hidden />
			<TransactButton
				content={<span>
					Send <InlineBalance value={this.balBond}/> to <InlineAccount badges={false} address={this.addrBond}/>
				</span>}
				icon='send'
				tx={{to: this.addrBond, value: this.balBond}}
				primary
				enabled={this.addrBond.map(_=>!!_)}
				colorPolicy='both'
				statusText
				size='big'
			/>
		</div>);
	}
}

class RegistryPanel extends React.Component {
	constructor () {
		super();

		this.nameBond = new Bond;
		this.sha3NameBond = sha3(this.nameBond).defaultTo('');
		this.contentBond = new Bond;
		this.canAlterContent = isOwned(bonds.registry.getOwner(this.sha3NameBond));
		this.keyBond = new Bond;
		this.keyBondType = this.keyBond.map(k => (options.find(_ => _.value == k) || {type: 'hash'}).type);
	}
	render () {
		return (<div style={{textAlign: 'center'}}>
			<InputBond bond={this.nameBond} validator={_ => _ || null}/>
			<Divider hidden />
			<List>
			  <List.Item>
				<List.Icon name='users' />
				<List.Content>Owner <InlineAccount address={bonds.registry.lookupOwner(this.nameBond)} /></List.Content>
			  </List.Item>
			  <List.Item>
				<List.Icon name='marker' />
				<List.Content>Primary Address ('A')  <InlineAccount address={bonds.registry.lookupAddress(this.nameBond, 'A')} /></List.Content>
			  </List.Item>
			</List>
			<Divider hidden />
			<BLabel>
				is ok
				<BLabelDetail content={this.nameBond.ready().map(_=>_.toString())} />
			</BLabel>
			<BLabel>
				is reserved
				<BLabelDetail content={bonds.registry.reserved(this.sha3NameBond).map(_=>_.toString())} />
			</BLabel>
			<BLabel>
				is owned
				<BLabelDetail content={isOwned(bonds.registry.getOwner(this.sha3NameBond)).map(_=>_.toString())} />
			</BLabel>
			<Divider hidden />
			<TransactButton
				disabled={bonds.registry.reserved(this.sha3NameBond)}
				enabled={this.nameBond.ready()}
				content='Reserve'
				primary
				tx={() => bonds.registry.reserve(this.sha3NameBond, {value: bonds.registry.fee()})}
			/>
			<TransactButton
				disabled={isNotOwned(bonds.registry.getOwner(this.sha3NameBond))}
				enabled={this.nameBond.ready()}
				content='Set Primary Address'
				tx={() => bonds.registry.setAddress(this.sha3NameBond, 'A', bonds.me, {from: bonds.registry.getOwner(this.sha3NameBond)})}
			/>
			<TransactButton
				disabled={isNotOwned(bonds.registry.getOwner(this.sha3NameBond))}
				enabled={this.nameBond.ready()}
				content='Backlink'
				tx={[
					() => bonds.registry.proposeReverse(this.nameBond, bonds.registry.getAddress(this.sha3NameBond, 'A'), {from: bonds.registry.getOwner(this.sha3NameBond)}),
					() => bonds.registry.confirmReverse(this.nameBond, {from: bonds.registry.getAddress(this.sha3NameBond, 'A')})
				]}
				causal
			/>
			<TransactButton
				disabled={bonds.registry.reserved(this.sha3NameBond)}
				enabled={this.nameBond.ready()}
				content='Reserve and Set Address'
				tx={[
					() => bonds.registry.reserve(this.sha3NameBond, {value: bonds.registry.fee()}),
					() => bonds.registry.setAddress(this.sha3NameBond, 'A', bonds.me),
					() => bonds.registry.proposeReverse(this.nameBond, bonds.me),
					() => bonds.registry.confirmReverse(this.nameBond)
				]}
				causal
			/>

			<Segment>
				<DropdownBond
					enabled={this.canAlterContent}
					options={options}
					bond={this.keyBond}
					style={{verticalAlign: 'top'}}
				/>
				<MultiInputBond
					enabled={this.canAlterContent}
					defaultValue={Bond.mapAll([bonds.registry.getData(this.sha3NameBond, this.keyBond), this.keyBondType], coerce)}
					bond={this.contentBond}
					type={this.keyBondType}

				/>
				<Divider hidden />
				<TransactButton
					enabled={this.canAlterContent}
					disabled={this.contentBond.notReady()}
					content='Set Content'
					tx={[
						() => bonds.registry.setData(this.sha3NameBond, this.keyBond, this.contentBond, {from: bonds.registry.getOwner(this.sha3NameBond)})
					]}
				/>
			</Segment>
			<Divider hidden />
			<TransactButton
				disabled={isNotOwned(bonds.registry.getOwner(this.sha3NameBond))}
				enabled={this.nameBond.ready()}
				icon='warning'
				content='Transfer'
				color='red'
				tx={() => bonds.registry.setOwner(this.sha3NameBond, bonds.me, {from: bonds.registry.getOwner(this.sha3NameBond)})}
			/>
			<TransactButton
				disabled={isNotOwned(bonds.registry.getOwner(this.sha3NameBond))}
				enabled={this.nameBond.ready()}
				content='Drop'
				icon='remove circle'
				color='red'
				tx={() => bonds.registry.drop(this.sha3NameBond, {from: bonds.registry.getOwner(this.sha3NameBond)})}
			/>
		</div>);
	}
}

class URLHintPanel extends React.Component {
	constructor () {
		super();
		this.bond = new Bond;
		this.urlBond = new Bond;
		this.urlBondHash = bonds.hashContent(this.urlBond);
	}
	render () {
		return (<div style={{textAlign: 'center'}}>
			<HashBond bond={this.bond} />
			<Divider hidden />
			<Rspan>{bonds.githubhint.entries(this.bond)[0]}</Rspan>
			<Divider />
			<URLBond bond={this.urlBond}/>
			<Rspan>{this.urlBond}</Rspan>
			<BLabel loading={this.urlBondHash.notReady()} content={bonds.urlBondHash}/>
			URLBond is ready = <Rspan>{this.urlBondHash.ready().map(_=>_.toString())}</Rspan>;
			<Divider hidden />
			<TransactButton enabled={this.urlBondHash.ready()} tx={() => bonds.githubhint.hintURL(bonds.urlBondHash, this.urlBond)}/>
		</div>);
	}
}

export function insertSigningPrefix (message) {
	return '\x19Ethereum Signed Message:\n' + message.length + message;
};

class SigningPanel extends React.Component {
	constructor () {
		super();
		this.bond = new Bond;
		this.sigBond = new Bond;
		this.state = {sig: null, signer: null};
		this.pubKey = Bond.mapAll([this.sigBond, this.bond], (sig, msg) => {
			if (!sig.startsWith('0x') || sig.length != 132 || !Number.parseInt(sig)) {
				return null;
			}
			let h = sha3(insertSigningPrefix(msg));
			console.log('h', h);
			return ecrecover(
				new Buffer(h.substr(2), 'hex'),
				Number.parseInt('0x' + sig.substr(130)),
				new Buffer(sig.substr(2, 64), 'hex'),
				new Buffer(sig.substr(66, 64), 'hex')
			);
		});
	}
	render () {
		return (<div style={{textAlign: 'center'}}>
			<InputBond
				bond={this.bond}
				placeholder='A message to sign'
				action={
					<SigningButton
						content='Sign message'
						primary
						message={this.bond}
						onSigned={v => this.setState({sig: v.signed})}
					/>
				}
			/>
			{
				this.state.sig ? (<div>
					RSV-encoded signature: <span style={{fontFamily: 'Monospace'}}>0x
						{this.state.sig[1].substr(2)}
						{this.state.sig[2].substr(2)}
						{this.state.sig[0].substr(2)}
				</span></div>) : null
			}
			<Divider hidden />
			<InputBond
				bond={this.bond}
				placeholder='A message to recover'
			/>
			<InputBond
				bond={this.sigBond}
				placeholder='RSV format signature'
			/>
			{
				<div>
				<div>
					Address: <InlineAccount address={this.pubKey.map(pub => pub ? bufferToHex(pubToAddress(pub, false)) :  null)}/>
				</div>
				<div>
					Public key:
					<Rspan style={{fontFamily: 'Monospace'}}>
						{this.pubKey.map(bufferToHex)}
					</Rspan>
				</div>
				</div>
			}
		</div>);
	}
}

class EncryptingPanel extends React.Component {
	constructor () {
		super();
		this.address = new Bond;
		this.publicKey = this.address.map(a => {
			console.log('a', a);
			return getTxs(a)
				.then(_ => _.length ? _[0] : null)
				.then(tx => ParityOptions.api.eth.getTransactionByHash(tx.hash))
				.then(_ => _.publicKey);
		});
		this.message = new Bond;
		this.cipher = new Bond;
		this.state = {encrypted: null, decrypted: null};
	}
	render () {
		return (<div style={{textAlign: 'center'}}>
			<AddressBond
				bond={this.address}
				placeholder="Recipient's address"
			/>
			<InputBond
				bond={this.publicKey}
				reversible
				placeholder="Recipient's public key"
			/>
			<InputBond
				bond={this.message}
				placeholder='A message to encrypt'
			/>
			<Button
				content='Encrypt message'
				primary
				onClick={() => {
					Bond.all([this.message, this.publicKey]).then(([msg, key]) => {
						let hex = ParityOptions.api.util.asciiToHex(msg);
						ParityOptions.api.parity.encryptMessage(key, hex)
							.then(enc => this.setState({encrypted: enc}));
					});
				}}
			/>
			{
				this.state.encrypted ? (<div>
					Encrypted:
					<Rdiv style={{fontFamily: 'Monospace', height: '3em', wordBreak: 'break-all', wordWrap: 'break-word', overflowY: 'scroll'}}>
						{this.state.encrypted}
					</Rdiv>
				</div>) : null
			}
			<Divider hidden />
			<InputBond
				bond={this.message}
				placeholder='A message to decrypt'
			/>
			<Button
				content='Decrypt message'
				secondary
				onClick={() => {
					Bond.all([this.message, bonds.me]).then(([msg, addr]) => {
						ParityOptions.api.parity.decryptMessage(addr, msg)
							.then(dec => this.setState({
								decrypted: ParityOptions.api.util.hexToAscii(dec)
							}));
					});
				}}
			/>
			{
				this.state.decrypted ? (<div>
					Decrypted:
					<Rdiv style={{fontFamily: 'Monospace', height: '3em', wordBreak: 'break-all', wordWrap: 'break-word', overflowY: 'scroll'}}>
						{this.state.decrypted}
					</Rdiv>
				</div>) : null
			}
		</div>);
	}
}

export class App extends React.Component {
	constructor () {
		super();
		this.state = { panel: 'sendEther' };
		this.handleItemClick = this.handleItemClick.bind(this);

		window.api = ParityOptions.api;
		window.getTxs = getTxs;
		window.sha3 = sha3;
		window.bonds = bonds;
		window.interpretQuantity = interpretQuantity;
		window.BigNumber = BigNumber;
		window.Bond = Bond;
		window.isOwned = isOwned;
		window.that = this;
		window.ecrecover = ecrecover;
		window.pubToAddress = pubToAddress;
		window.insertSigningPrefix = insertSigningPrefix;
		window.bufferToHex = bufferToHex;
		window.Buffer = Buffer;
	}

	handleItemClick (e, { name }) {
		this.setState({ panel: name });
	}

	render () {
		return (<div>
			<div style={{background: 'black', padding: '2em', marginBottom: '2em'}}>
				<Statistic.Group size='small' widths='two'>
					<BStatistic label='height' value={bonds.height.map(formatBlockNumber)} color='blue' inverted/>
					<BStatistic label='last block' value={Bond.mapAll([bonds.head.timestamp, bonds.time], (t, n) => Math.floor((n - t) / 1000) + ' seconds ago')} color='blue' inverted/>
				</Statistic.Group>
			</div>

			<Container>
				<Menu attached='top' secondary pointing>
					<Menu.Item name='sendEther' active={this.state.panel === 'sendEther'} onClick={this.handleItemClick} />
					<Menu.Item name='registry' active={this.state.panel === 'registry'} onClick={this.handleItemClick} />
					<Menu.Item name='urlHint' active={this.state.panel === 'urlHint'} onClick={this.handleItemClick} />
					<Menu.Item name='signing' active={this.state.panel === 'signing'} onClick={this.handleItemClick} />
					<Menu.Item name='encrypting' active={this.state.panel === 'encrypting'} onClick={this.handleItemClick} />
		        </Menu>
       			<Segment attached='bottom'>{
					this.state.panel === 'urlHint' ? (<URLHintPanel />) :
					this.state.panel === 'sendEther' ? (<SendPanel />) :
					this.state.panel === 'registry' ? (<RegistryPanel />) :
					this.state.panel === 'encrypting' ? (<EncryptingPanel />) :
					this.state.panel === 'signing' ? (<SigningPanel />) : null
				}</Segment>

				<Segment>
		 			<TransactButton content='Send' tx={{to: bonds.me}}/>
					<TransactButton color='blue' content='Send' tx={{to: bonds.me}} statusText/>
					<SigningButton color='black' content='Sign' message='Hello world!' colorPolicy='both'/>
					<SigningButton color='grey' content='Sign' message='Hello world!' statusIcon={false} statusText={true} colorPolicy='status'/>
					<TransactButton content='Send' tx={[{to: bonds.me},{to: bonds.me}]}/>
				</Segment>

				<Segment>
					My current account is <AccountLabel address={bonds.me}/> whereas the Sol account is
					<AccountLabel address={'0x00379ed52b6e8fc71ca6277a4fb99de6d38da6bb'}/>. On the other hand,
					<AccountLabel address={'0x001f2f055df43066bc9e97bb1faa6939e24fa97b'}/> is an unidentified account.
				</Segment>

				<Segment>
					My current account is <InlineAccount address={bonds.me}/> whereas the Sol account
					is <InlineAccount address={'0x00379ed52b6e8fc71ca6277a4fb99de6d38da6bb'}/>. On the other hand,
					<InlineAccount address={'0x001f2f055df43066bc9e97bb1faa6939e24fa97b'}/> is an unidentified account.
				</Segment>
			</Container>
		</div>);
	}
}
