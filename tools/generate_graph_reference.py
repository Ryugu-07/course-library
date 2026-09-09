import networkx as nx, json, math
from pathlib import Path
rows=[]
for g in nx.graph_atlas_g():
 n=len(g)
 if not n or n>6:continue
 matrix=nx.to_numpy_array(g,dtype=int).tolist()
 rows.append({'matrix':matrix,'planar':nx.check_planarity(g)[0],'bipartite':nx.is_bipartite(g),'components':nx.number_connected_components(g),'tree':nx.is_tree(g)})
for name,g in [('petersen',nx.petersen_graph()),('k5-subdivision',nx.complete_graph(5)),('k33',nx.complete_bipartite_graph(3,3))]:
 if name=='k5-subdivision':g.remove_edge(0,1);g.add_edges_from([(0,5),(5,1)])
 rows.append({'matrix':nx.to_numpy_array(g,dtype=int).tolist(),'planar':nx.check_planarity(g)[0],'bipartite':nx.is_bipartite(g),'components':nx.number_connected_components(g),'tree':nx.is_tree(g)})
p=Path(__file__).resolve().parent/'fixtures/graph-networkx.json';p.write_text(json.dumps({'generator':'NetworkX '+nx.__version__+' graph_atlas_g <=6 vertices and three named nonplanar graphs','cases':rows},separators=(',',':'))+'\n');print(len(rows),'independent graph fixtures')
