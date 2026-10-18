# Serveur de test : sert dist/ et imite l’API RPC de Supabase (PostgREST) sur un Postgres local.
import http.server,socketserver,json,os,sys,threading,psycopg2,psycopg2.pool
DIST=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../dist')
PORT=int(sys.argv[1]) if len(sys.argv)>1 else 8770
pool=psycopg2.pool.ThreadedConnectionPool(1,40,host='/tmp',port=5433,user='postgres',dbname='postgres')
CFG='var LORE_CONFIG={SUPABASE_URL:"http://127.0.0.1:%d",SUPABASE_ANON_KEY:"test-anon-key-0123456789abcdefghijklmnop"};'%PORT
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=DIST,**k)
    def log_message(s,*a): pass
    def end_headers(s):
        s.send_header('Access-Control-Allow-Origin','*');s.send_header('Access-Control-Allow-Headers','*');s.send_header('Cache-Control','no-store');super().end_headers()
    def do_OPTIONS(s): s.send_response(204);s.end_headers()
    def do_GET(s):
        if s.path.split('?')[0]=='/config.js' and not os.environ.get('NOCFG'):
            b=CFG.encode();s.send_response(200);s.send_header('Content-Type','application/javascript');s.send_header('Content-Length',str(len(b)));s.end_headers();s.wfile.write(b);return
        return super().do_GET()
    def do_POST(s):
        if not s.path.startswith('/rest/v1/rpc/'): s.send_response(404);s.end_headers();return
        fn=s.path.split('/rest/v1/rpc/')[1].split('?')[0]
        n=int(s.headers.get('Content-Length') or 0);body=json.loads(s.rfile.read(n) or b'{}')
        if not fn.replace('_','').isalnum(): s.send_response(400);s.end_headers();return
        args=', '.join('%s => %%(%s)s'%(k,k) for k in body.keys())
        params={k:(json.dumps(v) if isinstance(v,(dict,list)) else v) for k,v in body.items()}
        conn=pool.getconn()
        try:
            cur=conn.cursor();cur.execute('set role anon');cur.execute('select public.%s(%s)'%(fn,args),params);r=cur.fetchone()[0];conn.commit()
            out=json.dumps(r).encode();code=200
        except Exception as e:
            conn.rollback();out=json.dumps({'code':'PGRST202','message':str(e).split('\n')[0]}).encode();code=404 if 'does not exist' in str(e) else 400
        finally:
            try: cur.execute('reset role');conn.commit()
            except Exception: pass
            pool.putconn(conn)
        s.send_response(code);s.send_header('Content-Type','application/json');s.send_header('Content-Length',str(len(out)));s.end_headers();s.wfile.write(out)
class T(socketserver.ThreadingMixIn,http.server.HTTPServer): daemon_threads=True;allow_reuse_address=True
T(('127.0.0.1',PORT),H).serve_forever()
