import { NativeFilter, FilterNamedArguments, FilterArgument } from "./Base/Filter";
import { Stream, DynamicStream, OutputStream } from "../Stream";

export class ConcatFilter extends NativeFilter {
    parameters : string[] = [ 'n', 'v', 'a', 'unsafe' ];

    name : string = 'concat';

    generateOutputs () {
        const n = this.getParameter<number>( 'v', 1 );
        const a = this.getParameter<number>( 'a', 0 );

        this.outputsCount = n + a;

        return super.generateOutputs();
    }
}

function secondDimension<T> ( array : T[] | T[][] ) : T[][] {
    if ( array.length && !( array[ 0 ] instanceof Array ) ) {
        return [ array ] as T[][];
    }

    return array as T[][];
}

function transpose<T> ( ...arrays : T[][] ) : T[][] {
    if ( arrays.length === 0 ) {
        return arrays;
    }

    const transposed : T[][] = [];

    let line : number = 0;

    const colsLength : number = arrays.length;

    for ( line = 0; line < arrays[ 0 ].length; line++ ) {
        const tmp : T[] = [];
        
        for ( let col = 0; col < colsLength; col++ ) {
            tmp.push( arrays[ col ][ line ] );
        }

        transposed.push( tmp );
    }

    return transposed;
}

function interweave<T> ( ...arrays : T[][] ) : T[] {
    return transpose( ...arrays ).reduce( ( m, l ) => m.concat( l ), [] );
}

export function concat ( video : Stream[] | Stream[][], audio : Stream[] | Stream[][] ) : Stream[] {
    video = secondDimension<Stream>( video );
    audio = secondDimension<Stream>( audio );

    const v = video.length;
    const a = audio.length;
    const n = ( v ? video[ 0 ].length : ( a ? audio[ 0 ].length : 0 ) );

    const streams = interweave( ...video, ...audio );

    if ( n == 0 ) {
        throw new Error( `Concat filter needs at least one video or audio stream as input` );
    } else if ( n === 1 ) {
        return streams;
    }

    const filter = new ConcatFilter( { n, v, a } ).from( streams );

    return filter.outputs;
}

export function separator<T> ( items : T[], separator : ( index : number, item : T ) => T ) : T[] {
    const separated : T[] = [];

    for ( let i = 0; i < items.length; i++ ) {
        separated.push( items[ i ] );

        if ( i + 1 < items.length ) {
            separated.push( separator( i, items[ i ] ) );
        }
    }

    return separated;
}