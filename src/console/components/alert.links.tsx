import type { AlertActor, AlertNetwork } from "@/db";
import { NetworkCache } from "../network.cache";
import { trunc, truncMid } from "../util";
import { CopyButton } from "./btn.copy";
import {
  getExplorerAddressLink,
  getExplorerBlockLink,
  getExplorerTxLink,
} from "./links";

function _(network?: AlertNetwork) {
  return NetworkCache.fromId(network?.network ?? 0)?.urn;
}

function resolveChainId(networks: AlertNetwork[], actor: AlertActor) {
  if (networks.length === 1) {
    return _(networks[0]);
  } else if (networks.length === 2) {
    if (actor.role === "from") {
      return _(networks.find((n) => n.role === "origin"));
    } else if (actor.role === "to") {
      return _(networks.find((n) => n.role === "destination"));
    }
  }
  return null;
}

export function TxHashLink({
  hash,
  network,
}: {
  hash: string;
  network?: string;
}) {
  const explorerLink = network ? getExplorerTxLink(network, hash) : null;
  return (
    <>
      {explorerLink ? (
        <a
          href={explorerLink}
          className="font-mono truncate hover:text-zinc-200"
          target="_blank"
          rel="noreferrer"
        >
          {trunc(hash)}
        </a>
      ) : (
        <span className="font-mono truncate">{trunc(hash)}</span>
      )}
      <CopyButton title="Copy Tx Hash" text={hash} />
    </>
  );
}

export function BlockHashLink({
  hash,
  network,
}: {
  hash: string;
  network?: string;
}) {
  const explorerLink = network ? getExplorerBlockLink(network, hash) : null;
  return (
    <>
      {explorerLink ? (
        <a
          href={explorerLink}
          className="font-mono truncate hover:text-zinc-200"
          target="_blank"
          rel="noreferrer"
        >
          {trunc(hash)}
        </a>
      ) : (
        <span className="font-mono truncate">{trunc(hash)}</span>
      )}
      <CopyButton title="Copy Block Hash" text={hash} />
    </>
  );
}

export function AddressLink({
  networks,
  actor,
}: {
  networks?: AlertNetwork[];
  actor: AlertActor;
}) {
  const addressFormatted = actor.address_formatted;
  const chainId = networks ? resolveChainId(networks, actor) : null;
  const explorerLink = chainId
    ? getExplorerAddressLink(chainId, actor.address, addressFormatted)
    : null;

  return (
    <span className="flex gap-1 items-center font-mono">
      {explorerLink ? (
        <a
          href={explorerLink}
          className="truncate hover:text-zinc-200"
          target="_blank"
          rel="noreferrer"
        >
          {truncMid(addressFormatted)}
        </a>
      ) : (
        <span className="truncate">{truncMid(addressFormatted)}</span>
      )}

      <CopyButton title="Copy Address" text={addressFormatted} />
    </span>
  );
}
